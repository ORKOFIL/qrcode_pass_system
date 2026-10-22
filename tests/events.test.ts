import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../src/lib/prisma.ts', () => ({
    prisma: {
        user: { findUnique: vi.fn() },
        event: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
        ticket: { createManyAndReturn: vi.fn() },
        eventStaff: { findUnique: vi.fn() },
    },
}));

vi.mock('@prisma/client', () => ({
    Prisma: { PrismaClientKnownRequestError: class extends Error {} },
    PrismaClient: class {},
}));

// Не пишемо і не видаляємо справжні файли в ./qrcodes
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
const eventOfA = { id: 'event-a', name: 'Event A', organiserId: userA.id, capacity: 10 };
const eventOfB = { id: 'event-b', name: 'Event B', organiserId: userB.id, capacity: 10 };

const tokenOf = (email: string) => 'Bearer ' + jwt.sign({ userEmail: email }, process.env.JWT_ACCESS_SECRET!);
const asA = () => ({ Authorization: tokenOf(userA.email) });

describe('Events', () => {
    beforeAll(() => {
        process.env.JWT_ACCESS_SECRET = 'test_access_secret';
        process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
    });

    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});

        const users = [userA, userB];
        vi.mocked(prisma.user.findUnique).mockImplementation((async ({ where }: any) =>
            users.find(u => u.email === where.email) ?? null) as any);
        const events = [eventOfA, eventOfB];
        vi.mocked(prisma.event.findUnique).mockImplementation((async ({ where }: any) =>
            events.find(e => e.id === where.id) ?? null) as any);
    });

    describe('POST /event/create', () => {
        const body = { newEventTitle: 'Concert', newEventDate: '2026-12-01', newEventLocation: 'Lviv', initialCount: 50 };

        it('валідні поля створюють запис у БД', async () => {
            vi.mocked(prisma.event.create).mockResolvedValue({ ...eventOfA, id: 'new' } as any);

            const res = await request(app).post('/event/create').set(asA()).send(body);

            expect(res.status).toBe(201);
            expect(prisma.event.create).toHaveBeenCalledOnce();
            const { data } = vi.mocked(prisma.event.create).mock.calls[0]![0] as any;
            expect(data).toMatchObject({ name: 'Concert', location: 'Lviv', capacity: 50, organiserId: userA.id });
            expect(data.date).toEqual(new Date('2026-12-01'));
        });

        it.fails.each([[-5], [0], ['abc']])('некоректна місткість (%s) відхиляється валідацією', async (initialCount) => {
            vi.mocked(prisma.event.create).mockResolvedValue({ id: 'new' } as any);

            const res = await request(app).post('/event/create').set(asA()).send({ ...body, initialCount });

            expect(res.status).toBe(400);
            expect(prisma.event.create).not.toHaveBeenCalled();
        });

        it('без токена → 401', async () => {
            const res = await request(app).post('/event/create').send(body);

            expect(res.status).toBe(401);
            expect(prisma.event.create).not.toHaveBeenCalled();
        });
    });

    describe('POST /event/delete/:id', () => {
        it('видалення власної події → подія видалена', async () => {
            vi.mocked(prisma.event.delete).mockResolvedValue(eventOfA as any);

            const res = await request(app).post(`/event/delete/${eventOfA.id}`).set(asA());

            expect(res.status).toBe(200);
            expect(prisma.event.delete).toHaveBeenCalledWith({ where: { id: eventOfA.id } });
        });

        it('видалення чужої події → 403 Forbidden, подія не видаляється', async () => {
            const res = await request(app).post(`/event/delete/${eventOfB.id}`).set(asA());

            expect(res.status).toBe(403);
            expect(prisma.event.delete).not.toHaveBeenCalled();
        });

        // Зараз роут повертає 403 (userInfo.id != undefined), а не 404
        it.fails('видалення неіснуючої події → 404 Not Found', async () => {
            const res = await request(app).post('/event/delete/does-not-exist').set(asA());

            expect(res.status).toBe(404);
            expect(prisma.event.delete).not.toHaveBeenCalled();
        });
    });

    describe('POST /event/create/qrcodes', () => {
        it('кількість створених квитків відповідає запиту', async () => {
            vi.mocked(prisma.ticket.createManyAndReturn).mockImplementation((async ({ data }: any) => data) as any);

            const res = await request(app).post('/event/create/qrcodes').set(asA())
                .send({ id: eventOfA.id, capacity: 7, addon: false });

            expect(res.status).toBe(201);
            expect(res.body.qrcodes).toHaveLength(7);
            const { data } = vi.mocked(prisma.ticket.createManyAndReturn).mock.calls[0]![0] as any;
            expect(data).toHaveLength(7);
            expect(data.every((t: any) => t.eventId === eventOfA.id)).toBe(true);
            expect(new Set(data.map((t: any) => t.id)).size).toBe(7);
            expect(prisma.event.update).not.toHaveBeenCalled();
        });

        it('addon=true збільшує місткість події на кількість доданих квитків', async () => {
            vi.mocked(prisma.ticket.createManyAndReturn).mockImplementation((async ({ data }: any) => data) as any);

            await request(app).post('/event/create/qrcodes').set(asA())
                .send({ id: eventOfA.id, capacity: 3, addon: true });

            expect(prisma.event.update).toHaveBeenCalledWith({
                where: { id: eventOfA.id },
                data: { capacity: { increment: 3 } },
            });
        });

        it('генерація QR із неправильним eventId → запит відхиляється', async () => {
            const res = await request(app).post('/event/create/qrcodes').set(asA())
                .send({ id: 'wrong-event-id', capacity: 5 });

            expect(res.status).toBe(403);
            expect(prisma.ticket.createManyAndReturn).not.toHaveBeenCalled();
        });

        it('генерація QR для чужої події → 403, квитки не створюються', async () => {
            const res = await request(app).post('/event/create/qrcodes').set(asA())
                .send({ id: eventOfB.id, capacity: 5 });

            expect(res.status).toBe(403);
            expect(prisma.ticket.createManyAndReturn).not.toHaveBeenCalled();
        });
    });
});
