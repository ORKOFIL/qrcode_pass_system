import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';

vi.mock('../src/lib/prisma.ts', () => ({
    prisma: {
        user: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
        eventStaff: { findUnique: vi.fn(), update: vi.fn() },
    },
}));

vi.mock('../generated/prisma/client.ts', () => ({
    Prisma: { PrismaClientKnownRequestError: class extends Error {} },
    PrismaClient: class {},
}));

import app from '../src/server.ts';
import { prisma } from '../src/lib/prisma.ts';

const email = 'test@example.com';
const password = 'StrongPassword123';
const wrongPassword = 'WrongPassword999';

const cookieOf = (res: request.Response) => {
    const cookies = res.headers['set-cookie'] as unknown as string[];
    return cookies.find(c => c.startsWith('refreshToken='))!.split(';')[0]!;
};

describe('Auth', () => {
    beforeAll(() => {
        process.env.JWT_ACCESS_SECRET = 'test_access_secret';
        process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
    });

    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('POST /auth/register', () => {
        it('реєстрація нового користувача з валідними даними → 201 Created', async () => {
            vi.mocked(prisma.user.create).mockResolvedValue({ id: '1' } as any);

            const res = await request(app).post('/auth/register').send({ email, password, name: 'Test User' });

            expect(res.status).toBe(201);
            expect(jwt.verify(res.body.accessToken, process.env.JWT_ACCESS_SECRET!)).toMatchObject({ userEmail: email });
            expect(prisma.user.create).toHaveBeenCalledOnce();
        });

        // Зараз роут повертає 400 (а не 409) для дубліката
        it('повторна реєстрація з тим самим email → відмова (P2002)', async () => {
            const err: any = new Error('Unique constraint failed');
            err.code = 'P2002';
            vi.mocked(prisma.user.create).mockRejectedValue(err);

            const res = await request(app).post('/auth/register').send({ email, password, name: 'Test User' });

            expect(res.status).toBe(400);
            expect(res.body.message).toEqual({ message: 'Користувач з таким емейл вже зареєстрований' });
        });

        it('реєстрація з невалідним email → 400 (Zod)', async () => {
            const res = await request(app).post('/auth/register').send({ email: 'invalid-email', password, name: 'Test User' });

            expect(res.status).toBe(400);
            expect(res.body.message).toHaveProperty('email');
            expect(prisma.user.create).not.toHaveBeenCalled();
        });
    });

    describe('POST /auth/login', () => {
        it('вхід із правильним паролем → 200 і access token', async () => {
            const passwordHash = await argon2.hash(password);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ email, passwordHash } as any);
            vi.mocked(prisma.user.update).mockResolvedValue({} as any);

            const res = await request(app).post('/auth/login').send({ email, password });

            expect(res.status).toBe(200);
            expect(jwt.verify(res.body.accessToken, process.env.JWT_ACCESS_SECRET!)).toMatchObject({ userEmail: email });
            expect(cookieOf(res)).toMatch(/^refreshToken=.+/);
            expect(prisma.user.update).toHaveBeenCalledOnce();
        });

        // Зараз роут повертає 400 (а не 401)
        it('вхід із неправильним паролем → відмова, токени не видаються', async () => {
            const passwordHash = await argon2.hash(password);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ email, passwordHash } as any);

            const res = await request(app).post('/auth/login').send({ email, password: wrongPassword });

            expect(res.status).toBe(400);
            expect(res.body.message).toEqual({ message: 'Не вірний логін або пароль' });
            expect(res.body).not.toHaveProperty('accessToken');
            expect(res.headers['set-cookie']).toBeUndefined();
            expect(prisma.user.update).not.toHaveBeenCalled();
        });

        it('вхід із неіснуючим email → відмова в авторизації', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            const res = await request(app).post('/auth/login').send({ email: 'nobody@example.com', password });

            expect(res.status).toBe(400);
            expect(res.body.message).toEqual({ message: 'Не вірний логін або пароль' });
            expect(res.body).not.toHaveProperty('accessToken');
        });

        it('неправильний пароль перевіряється через argon2.verify() і дає відмову', async () => {
            const passwordHash = await argon2.hash(password);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ email, passwordHash } as any);
            const verifySpy = vi.spyOn(argon2, 'verify');

            const res = await request(app).post('/auth/login').send({ email, password: wrongPassword });

            expect(verifySpy).toHaveBeenCalledWith(passwordHash, wrongPassword);
            await expect(verifySpy.mock.results[0]!.value).resolves.toBe(false);
            expect(res.status).toBe(400);
            verifySpy.mockRestore();
        });
    });

    describe('POST /auth/refresh', () => {
        it('refresh після logout → оновлення токена заборонено', async () => {
            // Імітуємо БД: refreshToken користувача зберігається між запитами
            const passwordHash = await argon2.hash(password);
            const db = { email, passwordHash, refreshToken: '' };
            vi.mocked(prisma.user.findUnique).mockImplementation((async () => ({ ...db })) as any);
            vi.mocked(prisma.user.update).mockImplementation((async ({ data }: any) => {
                db.refreshToken = data.refreshToken;
                return { ...db };
            }) as any);

            const login = await request(app).post('/auth/login').send({ email, password });
            const cookie = cookieOf(login);
            expect(db.refreshToken).not.toBe('');

            // До logout refresh працює
            const ok = await request(app).post('/auth/refresh').set('Cookie', cookie);
            expect(ok.status).toBe(200);

            // Після refresh токен ротується, тож logout робимо з новим cookie
            const newCookie = cookieOf(ok);
            const logout = await request(app).post('/auth/logout').set('Cookie', newCookie);
            expect(logout.status).toBe(200);
            expect(db.refreshToken).toBe('');

            const res = await request(app).post('/auth/refresh').set('Cookie', newCookie);

            expect(res.status).not.toBe(200);
            expect(res.body).not.toHaveProperty('accessToken');
            expect(res.body.message).toBe('Користувача не знайдено або сесію завершено');
        });
    });
});
