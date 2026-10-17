import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from './lib/prisma.ts';
import cors from 'cors';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import z from 'zod';
import { Prisma } from '@prisma/client';
import authRouter from './routers/auth.ts'
import eventRouter from './routers/event.ts'
import changeStatusRouter from './routers/change_status.ts'
import cookieParser from "cookie-parser";
import path from 'path';

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use('/qrcodes', express.static(path.join(process.cwd(), 'qrcodes')));

interface AuthenticatedRequest extends Request {
    user?: { userEmail: string };
}

const requestTime = function (req: AuthenticatedRequest, res: Response, next: NextFunction) {
    console.log('middleware')
    const authHeader = req.headers.authorization
    if (!authHeader) {
        console.log("Токен відсутній")
        return res.status(401).json({ message: "Токен відсутній" });
    }
    const token = authHeader!.split(' ')[1];
    try {
        const decoded = jwt.verify(token!, process.env.JWT_ACCESS_SECRET!) as { userEmail: string }
        req.user = decoded
        console.log(decoded.userEmail)
        next();
    } catch (error) {
        console.log("Токен невірний або застарілий")
        return res.status(401).json({ message: "Токен невірний або застарілий" });
    }
};

app.use('/auth', authRouter);

app.use(requestTime);

app.use('/event', eventRouter);
app.use('/change/status', changeStatusRouter);

app.get('/load/events', async (req: AuthenticatedRequest, res: Response) => {
    try {
        console.log('/loaddata')
        const useremail = req.user?.userEmail
        if (!useremail) {
            return res.status(400).json({ status: 400, message: 'Відсутня емейл' });
        }

        const user = await prisma.user.findUnique({
            where: { email: useremail },
        })

        if (!user || !user.id) {
            return res.status(400).json({ status: 400, message: 'Відсутнє id' });
        }

        console.log(user.id)

        const events = await prisma.event.findMany({
            where: { organiserId: user.id }
        })

        const eventIds = events.map(item => item.id)
        const eventTikets = await prisma.ticket.findMany({
            where: {
                eventId: {
                    in: eventIds
                }
            }
        })

        return res.status(201).json({ status: 201, events: events, tikets: eventTikets });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});