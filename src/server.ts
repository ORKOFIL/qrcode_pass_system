import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from './lib/prisma.ts';
import cors from 'cors';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import z, { string } from 'zod';
import { Prisma } from '@prisma/client';
import authRouter from './routers/auth.ts'
import eventRouter from './routers/event.ts'
import changeStatusRouter from './routers/change_status.ts'
import cookieParser from "cookie-parser";
import path from 'path';
import { middleware } from './lib/middleware.ts';

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

app.use('/auth', authRouter);

app.get('/ticket/:ticketId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { ticketId } = req.params
        const tiket = await prisma.ticket.findUnique({
            where: { id: String(ticketId) }
        })
        if (!tiket) {
            return res.status(400).json({ status: 400, message: 'Відсутній квиток' });
        }
        const event = await prisma.event.findUnique({
            where: { id: String(tiket.eventId) }
        })
        if (!event) {
            return res.status(400).json({ status: 400, message: 'Відсутній івент' });
        }

        const data = [{
            id: tiket.id,
            eventName: event.name,
            eventDate: event.date,
            userInitials: tiket.userInitials || '',
            status: tiket.status
        }]

        return res.status(200).json({ status: 200, tiketInfo: data });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

app.use(middleware);

app.use('/event', eventRouter);
app.use('/change/status', changeStatusRouter);

app.get('/load/events', async (req: AuthenticatedRequest, res: Response) => {
    try {
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

        const eventScanners = await prisma.eventStaff.findMany({
            where: {
                eventId: {
                    in: eventIds
                }
            }
        })

        const updatedScanners = eventScanners.map(scanner => ({
            ...scanner,
            passwordHash: ''
        }));

        return res.status(200).json({ status: 200, events: events, tikets: eventTikets, staff: updatedScanners });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

app.post('/ticket/:ticketId/activate', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { ticketId } = req.params

        const staff = await prisma.eventStaff.findUnique({
            where: { name: String(req.user?.userEmail) }
        })
        const ticket = await prisma.ticket.findUnique({
            where: { id: String(ticketId) }
        })
        if (staff?.eventId === ticket?.eventId) {
            if (ticket?.status == 'activated') {
                return res.status(409).json({ status: 409, message: "Квиток вже був активований раніше" })
            }
            await prisma.ticket.update({
                where: { id: String(ticketId) },
                data: { status: 'activated' }
            })
            return res.json({ status: 201 });
        } else {
            return res.status(403).json({ status: 403, message: "Вам дано доступ до іншого івенту" })
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

app.get('/isregistered', async (req: AuthenticatedRequest, res: Response) => {

    return res.json({ status: 201, message: true });
})

app.listen(PORT, () => {
});