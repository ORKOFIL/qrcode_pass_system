import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.ts';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import z from 'zod';
import { Prisma } from '@prisma/client';

const router = Router();

interface AuthenticatedRequest extends Request {
    user?: { userEmail: string };
}

const registerSchema = z.object({
    email: z.email(),
    username: z.string().min(3, "Імя: мінімум 3 символи."),
    password: z.string().min(6, "Пароль: мінімум 6 символи."),
});

const loginSchema = z.object({
    email: z.email(),
    password: z.string(),
});

async function getTokens(email: String) {
    const newAccessToken = jwt.sign(
        { userEmail: email },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
        { userEmail: email },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
    );
    const newHashedRefreshToken = await argon2.hash(newRefreshToken)
    return { newAccessToken, newRefreshToken, newHashedRefreshToken }
}
async function getTokensStaff(email: String) {
    const newAccessToken = jwt.sign(
        { userEmail: email, isStaff: true },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
        { userEmail: email, isStaff: true },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
    );
    const newHashedRefreshToken = await argon2.hash(newRefreshToken)
    return { newAccessToken, newRefreshToken, newHashedRefreshToken }
}

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        const result = registerSchema.safeParse({
            email,
            username: name,
            password,
        })
        if (result.success) {

            const { newAccessToken, newRefreshToken, newHashedRefreshToken } = await getTokens(email)

            const hashedPass = await argon2.hash(password)

            await prisma.user.create({
                data: {
                    email,
                    passwordHash: hashedPass,
                    name,
                    role: 'organiser',
                    refreshToken: newHashedRefreshToken
                }
            })
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
            return res.status(201).json({ status: 201, accessToken: newAccessToken })
        } else {
            const errorsList = result.error.flatten().fieldErrors
            return res.status(400).json({ status: 400, message: errorsList });
        }
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError || error.code === 'P2002') {
            return res.status(400).json({ status: 400, message: { message: "Користувач з таким емейл вже зареєстрований" } })
        }
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const result = loginSchema.safeParse({
            email, password
        })
        if (result.success) {
            const user = await prisma.user.findUnique({
                where: { email },
            });
            if (!user) {
                return res.status(400).json({ status: 400, message: { message: "Не вірний логін або пароль" } });
            }
            const verifPass = await argon2.verify(user?.passwordHash!, password)
            if (!verifPass) {
                return res.status(400).json({ status: 400, message: { message: "Не вірний логін або пароль" } });
            }

            const { newAccessToken, newRefreshToken, newHashedRefreshToken } = await getTokens(email)

            await prisma.user.update({
                where: { email: email },
                data: { refreshToken: newHashedRefreshToken },
            });

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
            return res.status(200).json({ status: 200, accessToken: newAccessToken })
        } else {
            return res.status(400).json({ status: 400, message: { message: "Не коректно введені дані." } });
        }
    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
});

router.post('/refresh', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const oldRefreshToken = req.cookies.refreshToken
        if (!oldRefreshToken) {
            console.error('REFRESH TOKEN відсутній')
            return res.status(500).json({ message: "REFRESH TOKEN відсутній" })
        }

        let decoded: { userEmail: string, isStaff: boolean | undefined }
        try {
            decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET!) as { userEmail: string, isStaff: boolean | undefined }
        } catch (error) {
            return res.status(500).json({ message: "REFRESH TOKEN застарілий або недійсний" })
        }

        let user;
        if (decoded.isStaff == undefined) {
            user = await prisma.user.findUnique({
                where: { email: decoded.userEmail },
            })
        } else {
            user = await prisma.eventStaff.findUnique({
                where: { name: decoded.userEmail },
            })
        }

        if (!user || !user.refreshToken) {
            return res.status(500).json({ message: "Користувача не знайдено або сесію завершено" })
        }

        const isTokenValid = await argon2.verify(user.refreshToken, oldRefreshToken)
        if (!isTokenValid) {
            return res.status(500).json({ message: "Недійсний рефреш-токен" })
        }
        if (decoded.isStaff == undefined) {
            const { newAccessToken, newRefreshToken, newHashedRefreshToken } = await getTokens(decoded.userEmail)
            await prisma.user.update({
                where: { email: decoded.userEmail },
                data: { refreshToken: newHashedRefreshToken },
            });

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
            return res.status(200).json({ status: 200, accessToken: newAccessToken })
        } else {
            const { newAccessToken, newRefreshToken, newHashedRefreshToken } = await getTokensStaff(decoded.userEmail)

            await prisma.eventStaff.update({
                where: { name: decoded.userEmail },
                data: { refreshToken: newHashedRefreshToken },
            });
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
            return res.status(200).json({ status: 200, accessToken: newAccessToken })
        }

    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
});

router.post('/staff', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { login, password } = req.body;

        const user = await prisma.eventStaff.findUnique({
            where: { name: String(login) },
        });
        if (!user) {
            return res.status(400).json({ status: 400, message: { message: "Не вірний логін або пароль" } });
        }
        const verifPass = argon2.verify(user.passwordHash, password)
        if (!verifPass) {
            return res.status(400).json({ status: 400, message: { message: "Не вірний логін або пароль" } });
        }

        const { newAccessToken, newRefreshToken, newHashedRefreshToken } = await getTokensStaff(user.name)

        await prisma.eventStaff.update({
            where: { name: user.name },
            data: { refreshToken: newHashedRefreshToken },
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        return res.status(200).json({ status: 200, accessToken: newAccessToken })
    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
});

router.post('/logout', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userEmail: string; isStaff: boolean | undefined };
            if (decoded.isStaff == undefined) {
                await prisma.user.update({
                    where: { email: decoded.userEmail },
                    data: { refreshToken: '' },
                });
            } else {
                await prisma.eventStaff.update({
                    where: { name: decoded.userEmail },
                    data: { refreshToken: '' },
                });
            }
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        return res.status(200).json({ status: 200, message: 'Успішний вихід' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" });
    }
});


export default router;