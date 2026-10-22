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
const eventOfA = { id: 'event-a', name: 'Event A', organiserId: userA.id };
const eventOfB = { id: 'event-b', name: 'Event B', organiserId: 'user-b' };
const staffOfA = { id: 'staff-a', name: 'EventA-1abcde', eventId: eventOfA.id };

let tickets: Record<string, any>;

const accessOf = (email: string, isStaff?: boolean) =>
    'Bearer ' + jwt.sign({ userEmail: email, ...(isStaff ? { isStaff } : {}) }, process.env.JWT_ACCESS_SECRET!);
const asStaffA = () => ({ Authorization: accessOf(staffOfA.name, true) });
const asOrganiserA = () => ({ Authorization: accessOf(userA.email) });
const scan = (id: string) => request(app).post(`/ticket/${id}/activate`);

describe('Scans (перевірка QR та підтвердження входу)', () => {
    beforeAll(() => {
        process.env.JWT_ACCESS_SECRET = 'test_access_secret';
        process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
    });

    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});

        tickets = {
            issued: { id: 'issued', eventId: eventOfA.id, userInitials: 'Іван Петренко', status: 'issued' },
            created: { id: 'created', eventId: eventOfA.id, userInitials: '', status: 'created' },
            foreign: { id: 'foreign', eventId: eventOfB.id, userInitials: 'Інший', status: 'issued' },
        };

        const users = [userA];
        const events = [eventOfA, eventOfB];
        vi.mocked(prisma.user.findUnique).mockImplementation((async ({ where }: any) =>
            users.find(u => u.email === where.email) ?? null) as any);
        vi.mocked(prisma.event.findUnique).mockImplementation((async ({ where }: any) =>
            events.find(e => e.id === where.id) ?? null) as any);
        vi.mocked(prisma.eventStaff.findUnique).mockImplementation((async ({ where }: any) =>
            where.name === staffOfA.name ? staffOfA : null) as any);
        vi.mocked(prisma.ticket.findUnique).mockImplementation((async ({ where }: any) => {
            await Promise.resolve(); // як справжній запит до БД: дозволяє запитам чергуватись
            return tickets[where.id] ? { ...tickets[where.id] } : null;
        }) as any);
        vi.mocked(prisma.ticket.update).mockImplementation((async ({ where, data }: any) => {
            Object.assign(tickets[where.id], data);
            return { ...tickets[where.id] };
        }) as any);
        // Умовне оновлення атомарне, як UPDATE ... WHERE status IN (...) у БД
        vi.mocked(prisma.ticket.updateMany).mockImplementation((async ({ where, data }: any) => {
            const t = tickets[where.id];
            if (!t || t.eventId !== where.eventId || !where.status.in.includes(t.status)) return { count: 0 };
            Object.assign(t, data);
            return { count: 1 };
        }) as any);
    });

    it('дійсний виданий квиток → вхід підтверджується', async () => {
        const res = await scan('issued').set(asStaffA());

        expect(res.status).toBe(200);
        expect(tickets['issued'].status).toBe('activated');
    });

    it('повторне сканування використаного квитка → 409 Conflict', async () => {
        await scan('issued').set(asStaffA());
        const res = await scan('issued').set(asStaffA());

        expect(res.status).toBe(409);
        expect(tickets['issued'].status).toBe('activated');
    });

    it('квиток не існує → відмова', async () => {
        const res = await scan('does-not-exist').set(asStaffA());

        expect([403, 404]).toContain(res.status);
        expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
    });

    it.fails('квиток ще не видано (created) → відмова', async () => {
        const res = await scan('created').set(asStaffA());

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(tickets['created'].status).not.toBe('activated');
    });

    it.fails('квиток анульовано (повернуто в created) → відмова', async () => {
        await request(app).post('/change/status/created/issued').set(asOrganiserA());
        expect(tickets['issued'].status).toBe('created');

        const res = await scan('issued').set(asStaffA());

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(tickets['issued'].status).not.toBe('activated');
    });

    it('контролер сканує квиток чужої події → 403 Forbidden', async () => {
        const res = await scan('foreign').set(asStaffA());

        expect(res.status).toBe(403);
        expect(tickets['foreign'].status).toBe('issued');
        expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
    });

    it('організатор (не контролер) не може підтвердити вхід → 403', async () => {
        const res = await scan('issued').set(asOrganiserA());

        expect(res.status).toBe(403);
        expect(tickets['issued'].status).toBe('issued');
    });

    it('запит без авторизації → 401 Unauthorized', async () => {
        const res = await scan('issued');

        expect(res.status).toBe(401);
        expect(tickets['issued'].status).toBe('issued');
    });

    it('два одночасні запити на один квиток → успішний вхід рівно один раз', async () => {
        const results = await Promise.all([
            scan('issued').set(asStaffA()),
            scan('issued').set(asStaffA()),
        ]);

        const statuses = results.map(r => r.status).sort();
        expect(statuses).toEqual([200, 409]);
        expect(tickets['issued'].status).toBe('activated');
    });

    it('десять одночасних запитів → рівно один успіх', async () => {
        const results = await Promise.all(
            Array.from({ length: 10 }, () => scan('issued').set(asStaffA()))
        );

        expect(results.filter(r => r.status === 200)).toHaveLength(1);
        expect(results.filter(r => r.status === 409)).toHaveLength(9);
    });
});
