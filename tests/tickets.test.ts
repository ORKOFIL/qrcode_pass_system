import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../src/lib/prisma.ts', () => ({
    prisma: {
        user: { findUnique: vi.fn() },
        event: { findUnique: vi.fn() },
        ticket: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
        eventStaff: { findUnique: vi.fn() },
    },
}));

vi.mock('@prisma/client', () => ({
    Prisma: { PrismaClientKnownRequestError: class extends Error {} },
    PrismaClient: class {},
}));

import app from '../src/server.ts';
import { prisma } from '../src/lib/prisma.ts';

const userA = { id: 'user-a', email: 'a@example.com' };
const userB = { id: 'user-b', email: 'b@example.com' };
const eventOfA = { id: 'event-a', name: 'Event A', date: new Date('2026-12-01'), organiserId: userA.id };
const eventOfB = { id: 'event-b', name: 'Event B', date: new Date('2026-12-02'), organiserId: userB.id };
const staffOfA = { id: 'staff-a', name: 'EventA-1abcde', eventId: eventOfA.id };
const staffOfB = { id: 'staff-b', name: 'EventB-1abcde', eventId: eventOfB.id };

const FULL_NAME = 'Іван Петренко';
const MASKED_NAME = 'І*** П*******';

let tickets: Record<string, any>;

const accessOf = (email: string, isStaff?: boolean) =>
    'Bearer ' + jwt.sign({ userEmail: email, ...(isStaff ? { isStaff } : {}) }, process.env.JWT_ACCESS_SECRET!);
const refreshCookieOf = (name: string, isStaff = true) =>
    'refreshToken=' + jwt.sign({ userEmail: name, isStaff }, process.env.JWT_REFRESH_SECRET!);

const asA = () => ({ Authorization: accessOf(userA.email) });
const asStaffA = () => ({ Authorization: accessOf(staffOfA.name, true) });

describe('Tickets', () => {
    beforeAll(() => {
        process.env.JWT_ACCESS_SECRET = 'test_access_secret';
        process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
    });

    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});

        tickets = {
            'ticket-a': { id: 'ticket-a', eventId: eventOfA.id, userInitials: '', status: 'created' },
            'ticket-b': { id: 'ticket-b', eventId: eventOfB.id, userInitials: '', status: 'created' },
            'ticket-named': { id: 'ticket-named', eventId: eventOfA.id, userInitials: FULL_NAME, status: 'issued' },
        };

        const users = [userA, userB];
        const events = [eventOfA, eventOfB];
        const staff = [staffOfA, staffOfB];
        vi.mocked(prisma.user.findUnique).mockImplementation((async ({ where }: any) =>
            users.find(u => u.email === where.email) ?? null) as any);
        vi.mocked(prisma.event.findUnique).mockImplementation((async ({ where }: any) =>
            events.find(e => e.id === where.id) ?? null) as any);
        vi.mocked(prisma.eventStaff.findUnique).mockImplementation((async ({ where }: any) =>
            staff.find(s => s.name === where.name) ?? null) as any);
        vi.mocked(prisma.ticket.findUnique).mockImplementation((async ({ where }: any) =>
            tickets[where.id] ? { ...tickets[where.id] } : null) as any);
        vi.mocked(prisma.ticket.update).mockImplementation((async ({ where, data }: any) => {
            Object.assign(tickets[where.id], data);
            return { ...tickets[where.id] };
        }) as any);
        vi.mocked(prisma.ticket.updateMany).mockImplementation((async ({ where, data }: any) => {
            const t = tickets[where.id];
            if (!t || t.eventId !== where.eventId || !where.status.in.includes(t.status)) return { count: 0 };
            Object.assign(t, data);
            return { count: 1 };
        }) as any);
    });

    describe('POST /change/status/issued/:id — видача квитка', () => {
        it('квиток created успішно видається й переходить у issued', async () => {
            const res = await request(app).post('/change/status/issued/ticket-a').set(asA())
                .send({ fullname: FULL_NAME });

            expect(res.status).toBe(200);
            expect(prisma.ticket.update).toHaveBeenCalledWith({
                where: { id: 'ticket-a' },
                data: { status: 'issued', userInitials: FULL_NAME },
            });
            expect(tickets['ticket-a']).toMatchObject({ status: 'issued', userInitials: FULL_NAME });
        });

        it('видачу може виконувати лише організатор відповідної події', async () => {
            // Організатор B не може видати квиток події A
            const asB = { Authorization: accessOf(userB.email) };
            const denied = await request(app).post('/change/status/issued/ticket-a').set(asB).send({ fullname: FULL_NAME });

            expect(denied.status).toBe(403);
            expect(tickets['ticket-a'].status).toBe('created');

            // Організатор A може
            const ok = await request(app).post('/change/status/issued/ticket-a').set(asA()).send({ fullname: FULL_NAME });
            expect(ok.status).toBe(200);
        });

        it('без токена видача неможлива → 401', async () => {
            const res = await request(app).post('/change/status/issued/ticket-a').send({ fullname: FULL_NAME });

            expect(res.status).toBe(401);
            expect(prisma.ticket.update).not.toHaveBeenCalled();
        });

        it('неможливо видати квиток із неіснуючим ID', async () => {
            const res = await request(app).post('/change/status/issued/does-not-exist').set(asA())
                .send({ fullname: FULL_NAME });

            expect([403, 404]).toContain(res.status);
            expect(prisma.ticket.update).not.toHaveBeenCalled();
        });

        it('неможливо змінити квиток чужої події', async () => {
            const res = await request(app).post('/change/status/issued/ticket-b').set(asA())
                .send({ fullname: FULL_NAME });

            expect(res.status).toBe(403);
            expect(prisma.ticket.update).not.toHaveBeenCalled();
            expect(tickets['ticket-b']).toMatchObject({ status: 'created', userInitials: '' });
        });
    });

    describe('POST /change/status/:status/:id — зміна статусу', () => {
        it('чужий квиток не можна перевести і в інший валідний статус', async () => {
            const res = await request(app).post('/change/status/activated/ticket-b').set(asA());

            expect(res.status).toBe(403);
            expect(tickets['ticket-b'].status).toBe('created');
        });

        it.each(['cancelled', 'foo', '123'])('невалідний статус "%s" → 400', async (status) => {
            const res = await request(app).post(`/change/status/${status}/ticket-a`).set(asA());

            expect(res.status).toBe(400);
            expect(prisma.ticket.update).not.toHaveBeenCalled();
            expect(tickets['ticket-a'].status).toBe('created');
        });
    });

    describe('POST /ticket/:ticketId/activate — перевірка на вході', () => {
        // У схемі немає статусу "cancelled": скасування = повернення квитка в created
        // (POST /change/status/created/:id), а created зараз вважається валідним для входу.
        it.fails('після скасування (повернення в created) квиток не проходить перевірку на вході', async () => {
            tickets['ticket-a']!.status = 'issued';
            await request(app).post('/change/status/created/ticket-a').set(asA());
            expect(tickets['ticket-a'].status).toBe('created');

            const res = await request(app).post('/ticket/ticket-a/activate').set(asStaffA());

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(tickets['ticket-a'].status).not.toBe('activated');
        });

        it('виданий квиток проходить перевірку один раз, повторний вхід → 409', async () => {
            tickets['ticket-a']!.status = 'issued';

            const first = await request(app).post('/ticket/ticket-a/activate').set(asStaffA());
            const second = await request(app).post('/ticket/ticket-a/activate').set(asStaffA());

            expect(first.status).toBe(200);
            expect(second.status).toBe(409);
        });

        it('сканер іншої події не може активувати квиток → 403', async () => {
            const res = await request(app).post('/ticket/ticket-a/activate')
                .set({ Authorization: accessOf(staffOfB.name, true) });

            expect(res.status).toBe(403);
            expect(tickets['ticket-a'].status).toBe('created');
        });
    });

    describe('GET /ticket/:ticketId — публічний endpoint', () => {
        const publicKeys = ['eventDate', 'eventName', 'id', 'status', 'userInitials'];

        it('без авторизації повертає лише маскований ПІБ і мінімум полів', async () => {
            const res = await request(app).get('/ticket/ticket-named');

            expect(res.status).toBe(200);
            expect(res.body.isRegistered).toBe(false);
            expect(res.body.tiketInfo).toHaveLength(1);
            expect(res.body.tiketInfo[0].userInitials).toBe(MASKED_NAME);
            expect(Object.keys(res.body.tiketInfo[0]).sort()).toEqual(publicKeys);
            expect(res.text).not.toContain('Іван');
            expect(res.text).not.toContain('Петренко');
            expect(res.text).not.toContain(userA.id);
            expect(res.text).not.toContain('organiserId');
        });

        it('з недійсним refresh-токеном ПІБ залишається маскованим', async () => {
            const res = await request(app).get('/ticket/ticket-named').set('Cookie', 'refreshToken=garbage');

            expect(res.body.isRegistered).toBe(false);
            expect(res.body.tiketInfo[0].userInitials).toBe(MASKED_NAME);
        });

        it('організатор (не сканер) через cookie не бачить повний ПІБ', async () => {
            const res = await request(app).get('/ticket/ticket-named').set('Cookie', refreshCookieOf(userA.email, false));

            expect(res.body.isRegistered).toBe(false);
            expect(res.body.tiketInfo[0].userInitials).toBe(MASKED_NAME);
        });

        it('сканер іншої події бачить лише маскований ПІБ', async () => {
            const res = await request(app).get('/ticket/ticket-named').set('Cookie', refreshCookieOf(staffOfB.name));

            expect(res.body.isRegistered).toBe(false);
            expect(res.body.tiketInfo[0].userInitials).toBe(MASKED_NAME);
        });

        it('сканер цієї події бачить повний ПІБ', async () => {
            const res = await request(app).get('/ticket/ticket-named').set('Cookie', refreshCookieOf(staffOfA.name));

            expect(res.body.isRegistered).toBe(true);
            expect(res.body.tiketInfo[0].userInitials).toBe(FULL_NAME);
        });

        it('неіснуючий квиток → 400 без даних', async () => {
            const res = await request(app).get('/ticket/does-not-exist');

            expect(res.status).toBe(400);
            expect(res.body).not.toHaveProperty('tiketInfo');
        });
    });
});
