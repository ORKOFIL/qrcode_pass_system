import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.ts';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const router = Router();

interface AuthenticatedRequest extends Request {
    user?: { userEmail: string };
}

async function generateQRCodes(links: string[], eventId: string) {
    console.log('Починаємо генерацію QR-кодів...\n');
    console.log(links);

    const outputDir = path.join(process.cwd(), 'qrcodes', eventId);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log('Створено папку: qrcodes');
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

    console.log('\nУсі QR-коди успішно згенеровано!');
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
        const generatedQrs = Array.from({ length: capacity }, () => ({
            id: uuidv4(),
            eventId: id,
            userInitials: '',
        }));
        console.log(generatedQrs)
        const qrcodes = await prisma.ticket.createManyAndReturn({
            data: generatedQrs
        });
        generateQRCodes(qrcodes.map(item => item.id), id)
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

        const eventDir = path.join(process.cwd(), 'qrcodes', String(id));
        if (fs.existsSync(eventDir)) {
            fs.rmSync(eventDir, { recursive: true, force: true });
        }

        await prisma.event.delete({
            where: { id: String(id) }
        })
        return res.status(201).json({ status: 201 });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

export default router;