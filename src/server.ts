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

//avalanche meeting-1nvZOw
//Tt6ZA

//second-1PcCOE
//4pUCB

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

function maskWords(str: string) {
    if (!str) return '';
    return str.replace(/(\p{L})(\p{L}*)/gu, (match, first, rest) => {
        return first + '*'.repeat(rest.length);
    });
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

        let data = [{
            id: tiket.id,
            eventName: event.name,
            eventDate: event.date,
            userInitials: tiket.userInitials,
            status: tiket.status
        }]

        const notregData = [{
            id: tiket.id,
            eventName: event.name,
            eventDate: event.date,
            userInitials: maskWords(tiket.userInitials),
            status: tiket.status
        }]

        const oldRefreshToken = req.cookies.refreshToken
        if (!oldRefreshToken) {
            return res.status(200).json({ status: 200, tiketInfo: notregData, isRegistered: false });
        }
        let decoded: { userEmail: string, isStaff: boolean | undefined }
        try {
            decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET!) as { userEmail: string, isStaff: boolean | undefined }
        } catch (error) {
            return res.status(200).json({ status: 200, tiketInfo: notregData, isRegistered: false });
        }
        let user;
        if (decoded.isStaff == true) {
            user = await prisma.eventStaff.findUnique({
                where: { name: decoded.userEmail },
            })
        } else {
            console.log('not staff')
            return res.status(200).json({ status: 200, tiketInfo: notregData, isRegistered: false });
        }
        if (!user || !user.eventId || user.eventId != event.id) {
            return res.status(200).json({ status: 200, tiketInfo: notregData, isRegistered: false });
        }
        return res.status(200).json({ status: 200, tiketInfo: data, isRegistered: true });
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
            const result = await prisma.ticket.updateMany({
                where: { id: String(ticketId), eventId: String(ticket?.eventId), status: { in: ['issued', 'created'] } },
                data: { status: 'activated' }
            })
            if (result.count !== 1) {
                return res.status(409).json({
                    status: 409,
                    message: "Квиток недійсний або вже використаний"
                })
            }
            return res.json({ status: 200 });
        } else {
            return res.status(403).json({ status: 403, message: "Вам дано доступ до іншого івенту" })
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

app.listen(PORT, () => {
});

export default app;