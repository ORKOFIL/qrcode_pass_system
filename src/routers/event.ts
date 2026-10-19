import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.ts';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';

const router = Router();

interface AuthenticatedRequest extends Request {
    user?: { userEmail: string };
}

async function generateQRCodes(links: string[], eventId: string) {

    const outputDir = path.join(process.cwd(), 'qrcodes', eventId);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const item of links) {
        const filePath = path.join(outputDir, `${item}.png`);

        try {
            await QRCode.toFile(filePath, `http://localhost:5173/${item}`, {
                errorCorrectionLevel: 'H',
                type: 'png',
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
        } catch (err) {
            console.error(`[Помилка] Не вдалося створити для ${item}:`, err);
        }
    }
}

router.post('/create', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { newEventTitle: title, newEventDate: date, newEventLocation: location, initialCount: count } = req.body

        const useremail = req.user?.userEmail
        if (!useremail) {
            return res.status(400).json({ status: 400, message: 'Відсутня емейл' });
        }

        const userInfo = await prisma.user.findUnique({
            where: { email: useremail }
        });

        if (!userInfo || !userInfo.id) {
            return res.status(400).json({ status: 400, message: 'Відсутнє id' });
        }

        const event = await prisma.event.create({
            data: {
                name: title,
                date: new Date(date),
                location,
                capacity: count,
                organiserId: userInfo.id,
            },
        });

        return res.status(201).json({ status: 201, data: event });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

router.post('/create/qrcodes', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id, capacity, addon } = req.body

        const user = req.user?.userEmail
        const userInfo = await prisma.user.findUnique({
            where: { email: String(user) }
        })
        const eventInfo = await prisma.event.findUnique({
            where: { id: id }
        })
        if (userInfo?.id != eventInfo?.organiserId) {
            return res.status(403).json({ status: 403, message: "ID юзера не зходиться з ID власника івенту" })
        }

        const generatedQrs = Array.from({ length: capacity }, () => ({
            id: uuidv4(),
            eventId: id,
            userInitials: '',
        }));
        const qrcodes = await prisma.ticket.createManyAndReturn({
            data: generatedQrs
        });
        await generateQRCodes(qrcodes.map(item => item.id), id)
        if (addon == true) {
            await prisma.event.update({
                where: { id: id },
                data: { capacity: { increment: capacity } }
            })
        }
        return res.status(201).json({ status: 201, qrcodes });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

router.post('/delete/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params

        const user = req.user?.userEmail
        const userInfo = await prisma.user.findUnique({
            where: { email: String(user) }
        })
        const ticketInfo = await prisma.ticket.findUnique({
            where: { id: String(id) }
        })
        const eventInfo = await prisma.event.findUnique({
            where: { id: String(ticketInfo?.eventId) }
        })
        if (userInfo?.id != eventInfo?.organiserId) {
            return res.status(403).json({ status: 403, message: "ID юзера не зходиться з ID власника івенту" })
        }

        if (userInfo?.id != eventInfo?.organiserId) {
            return res.status(403).json({ status: 403, message: "ID юзера не зходиться з ID власника івенту" })
        }

        const eventDir = path.join(process.cwd(), 'qrcodes', String(id));
        if (fs.existsSync(eventDir)) {
            fs.rmSync(eventDir, { recursive: true, force: true });
        }

        await prisma.event.delete({
            where: { id: String(id) }
        })
        return res.status(200).json({ status: 200 });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

router.post('/:eventId/scanners/create', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { eventId } = req.params;
        const { count } = req.body;

        const user = req.user?.userEmail
        const userInfo = await prisma.user.findUnique({
            where: { email: String(user) }
        })
        const eventInfo = await prisma.event.findUnique({
            where: { id: String(eventId) }
        })
        if (userInfo?.id != eventInfo?.organiserId) {
            return res.status(403).json({ status: 403, message: "ID юзера не зходиться з ID власника івенту" })
        }
        const event = await prisma.event.findUnique({
            where: { id: String(eventId) }
        });

        if (!event) {
            return res.status(404).json({ message: 'Івент не знайдено' });
        }

        const newScannersData = [];
        for (let i = 1; i <= Number(count); i++) {
            const staffName = `${event.name}-${i}${nanoid(5)}`;
            const newRefreshToken = jwt.sign(
                { userEmail: staffName, isStaff: true },
                process.env.JWT_REFRESH_SECRET!,
                { expiresIn: '7d' }
            );
            const newHashedRefreshToken = await argon2.hash(newRefreshToken)

            newScannersData.push({
                eventId: String(eventId),
                name: staffName,
                passwordHash: nanoid(10),
                refreshToken: newHashedRefreshToken
            });
        }

        const ScannersData = await prisma.eventStaff.createManyAndReturn({
            data: newScannersData
        });

        return res.status(201).json({ scanners: ScannersData });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

router.post('/scanner/delete/:scannerId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { scannerId } = req.params

        const user = req.user?.userEmail
        const userInfo = await prisma.user.findUnique({
            where: { email: String(user) }
        })
        const scannerInfo = await prisma.eventStaff.findUnique({
            where: { id: String(scannerId) }
        })
        const eventInfo = await prisma.event.findUnique({
            where: { id: String(scannerInfo?.eventId)}
        })
        if (userInfo?.id != eventInfo?.organiserId) {
            return res.status(403).json({ status: 403, message: "ID юзера не зходиться з ID власника івенту" })
        }

        const deleted = await prisma.eventStaff.deleteMany({
            where: { id: String(scannerId) }
        })
        if (deleted.count === 0) {
            console.error('Сканувальника не знайдено');
            return res.status(404).json({ message: 'Сканувальника не знайдено' });
        }
        return res.status(200).json({ message: 'Сканувальники успішно створені' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

export default router;