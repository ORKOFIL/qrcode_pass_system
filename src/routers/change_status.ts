import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.ts';

const router = Router();

interface AuthenticatedRequest extends Request {
    user?: { userEmail: string };
}

router.post('/issued/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { fullname } = req.body

        await prisma.ticket.update({
            where: { id: String(id) },
            data: { status: 'issued', userInitials: fullname }
        })

        return res.status(201).json({ status: 201 });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

router.post('/activated/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        await prisma.ticket.update({
            where: { id: String(id) },
            data: { status: 'activated' }
        })

        return res.status(201).json({ status: 201 });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

export default router;