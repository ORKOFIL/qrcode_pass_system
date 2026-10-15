import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from './lib/prisma.ts';
import cors from 'cors';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import z from 'zod';
import { Prisma } from '@prisma/client';
import authRouter from './routers/auth.ts'
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

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

app.post('/event/create', async (req: AuthenticatedRequest, res: Response) => {
    try {
        console.log('/event/create')
        const { newEventTitle: title, newEventDate: date, newEventLocation: location, initialCount: count } = req.body
        console.log(title)
        console.log(req.user?.userEmail)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});