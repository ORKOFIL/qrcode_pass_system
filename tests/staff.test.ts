import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';

vi.mock('../src/lib/prisma.ts', () => ({
    prisma: {
        user: { findUnique: vi.fn() },
        event: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
        ticket: { findUnique: vi.fn(), updateMany: vi.fn(), createManyAndReturn: vi.fn() },
        eventStaff: { findUnique: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    },
}));

vi.mock('@prisma/client', () => ({
    Prisma: { PrismaClientKnownRequestError: class extends Error {} },
    PrismaClient: class {},
}));

vi.mock('qrcode', () => ({ toFile: vi.fn().mockResolvedValue(undefined) }));
vi.mock('fs', async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        default: { ...actual.default, existsSync: vi.fn(() => false), mkdirSync: vi.fn(), rmSync: vi.fn() },
    };
});

import app from '../src/server.ts';
import { prisma } from '../src/lib/prisma.ts';

const userA = { id: 'user-a', email: 'a@example.com' };
const userB = { id: 'user-b', email: 'b@example.com' };
const eventOfA = { id: 'event-a', name: 'Event A', organiserId: userA.id };
const eventOfB = { id: 'event-b', name: 'Event B', organiserId: userB.id };
const password = 'abc12';

let staffOfA: any;
let staffOfB: any;

const accessOf = (email: string, isStaff?: boolean) =>
    'Bearer ' + jwt.sign({ userEmail: email, ...(isStaff ? { isStaff } : {}) }, process.env.JWT_ACCESS_SECRET!);
const asA = () => ({ Authorization: accessOf(userA.email) });
const asStaffA = () => ({ Authorization: accessOf('EventA-1abcde', true) });

describe('Staff (контролери подій)', () => {
    beforeAll(async () => {
        process.env.JWT_ACCESS_SECRET = 'test_access_secret';
        process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
        const passwordHash = await argon2.hash(password);
        staffOfA = { id: 'staff-a', name: 'EventA-1abcde', eventId: eventOfA.id, passwordHash };
        staffOfB = { id: 'staff-b', name: 'EventB-1abcde', eventId: eventOfB.id, passwordHash };
    });

    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});

        const users = [userA, userB];
        const events = [eventOfA, eventOfB];
        const staff = [staffOfA, staffOfB];
        const tickets = [
            { id: 'ticket-a', eventId: eventOfA.id, status: 'issued' },
            { id: 'ticket-b', eventId: eventOfB.id, status: 'issued' },
        ];
        vi.mocked(prisma.user.findUnique).mockImplementation((async ({ where }: any) =>
            users.find(u => u.email === where.email) ?? null) as any);
        vi.mocked(prisma.event.findUnique).mockImplementation((async ({ where }: any) =>
            events.find(e => e.id === where.id) ?? null) as any);
        vi.mocked(prisma.eventStaff.findUnique).mockImplementation((async ({ where }: any) =>
            staff.find(s => s.name === where.name || s.id === where.id) ?? null) as any);
        vi.mocked(prisma.ticket.findUnique).mockImplementation((async ({ where }: any) =>
            tickets.find(t => t.id === where.id) ?? null) as any);
        vi.mocked(prisma.ticket.updateMany).mockResolvedValue({ count: 1 } as any);
        vi.mocked(prisma.eventStaff.update).mockResolvedValue({} as any);
        vi.mocked(prisma.eventStaff.deleteMany).mockResolvedValue({ count: 1 } as any);
    });

    describe('POST /auth/staff — вхід контролера', () => {
        it('контролер із правильними обліковими даними входить', async () => {
            const res = await request(app).post('/auth/staff').send({ login: staffOfA.name, password });

            expect(res.status).toBe(200);
            const payload = jwt.verify(res.body.accessToken, process.env.JWT_ACCESS_SECRET!) as any;
            expect(payload).toMatchObject({ userEmail: staffOfA.name, isStaff: true });
            const cookies = res.headers['set-cookie'] as unknown as string[];
            expect(cookies.some(c => c.startsWith('refreshToken=') && c.includes('HttpOnly'))).toBe(true);
            expect(prisma.eventStaff.update).toHaveBeenCalledOnce();
        });

        // Зараз роут повертає 400 (а не 401) на неправильні дані
        it('неправильний пароль → відмова, токени не видаються', async () => {
            const res = await request(app).post('/auth/staff').send({ login: staffOfA.name, password: 'wrong' });

            expect(res.status).toBe(400);
            expect(res.body).not.toHaveProperty('accessToken');
            expect(res.headers['set-cookie']).toBeUndefined();
            expect(prisma.eventStaff.update).not.toHaveBeenCalled();
        });

        it('неіснуючий логін → відмова', async () => {
            const res = await request(app).post('/auth/staff').send({ login: 'nobody', password });

            expect(res.status).toBe(400);
            expect(res.body).not.toHaveProperty('accessToken');
        });
    });

    describe('Доступ контролера до захищених endpoint', () => {
        it('без токена → 401', async () => {
            const res = await request(app).post('/ticket/ticket-a/activate');

            expect(res.status).toBe(401);
            expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
        });

        it('з простроченим/підробленим токеном → 401', async () => {
            const forged = 'Bearer ' + jwt.sign({ userEmail: staffOfA.name, isStaff: true }, 'other_secret');
            const res = await request(app).post('/ticket/ticket-a/activate').set({ Authorization: forged });

            expect(res.status).toBe(401);
        });

        it('контролер A працює з квитком події B, до якої його не додали → 403', async () => {
            const res = await request(app).post('/ticket/ticket-b/activate').set(asStaffA());

            expect(res.status).toBe(403);
            expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
        });

        it('контролер A працює зі своєю подією → успіх', async () => {
            const res = await request(app).post('/ticket/ticket-a/activate').set(asStaffA());

            expect(res.status).toBe(200);
        });
    });

    describe('Контролер не має прав організатора', () => {
        it('не може видалити подію (навіть власної події)', async () => {
            const res = await request(app).post(`/event/delete/${eventOfA.id}`).set(asStaffA());

            expect(res.status).toBe(403);
            expect(prisma.event.delete).not.toHaveBeenCalled();
        });

        it('не може створювати квитки', async () => {
            const res = await request(app).post('/event/create/qrcodes').set(asStaffA())
                .send({ id: eventOfA.id, capacity: 5 });

            expect(res.status).toBe(403);
            expect(prisma.ticket.createManyAndReturn).not.toHaveBeenCalled();
        });

        it('не може видаляти інших контролерів', async () => {
            const res = await request(app).post(`/event/scanner/delete/${staffOfA.id}`).set(asStaffA());

            expect(res.status).toBe(403);
            expect(prisma.eventStaff.deleteMany).not.toHaveBeenCalled();
        });

        it('не може створювати подію', async () => {
            const res = await request(app).post('/event/create').set(asStaffA())
                .send({ newEventTitle: 'X', newEventDate: '2026-12-01', newEventLocation: 'L', initialCount: 5 });

            expect(res.status).toBe(400);
            expect(prisma.event.create).not.toHaveBeenCalled();
        });
    });

    describe('POST /event/scanner/delete/:scannerId', () => {
        it('організатор видаляє власного контролера → успіх', async () => {
            const res = await request(app).post(`/event/scanner/delete/${staffOfA.id}`).set(asA());

            expect(res.status).toBe(200);
            expect(prisma.eventStaff.deleteMany).toHaveBeenCalledWith({ where: { id: staffOfA.id } });
        });

        it('організатор A видаляє контролера організатора B → 403', async () => {
            const res = await request(app).post(`/event/scanner/delete/${staffOfB.id}`).set(asA());

            expect(res.status).toBe(403);
            expect(prisma.eventStaff.deleteMany).not.toHaveBeenCalled();
        });

        it('без токена → 401', async () => {
            const res = await request(app).post(`/event/scanner/delete/${staffOfA.id}`);

            expect(res.status).toBe(401);
            expect(prisma.eventStaff.deleteMany).not.toHaveBeenCalled();
        });
    });
});
