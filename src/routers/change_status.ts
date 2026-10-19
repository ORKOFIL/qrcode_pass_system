import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.ts';

const router = Router();

interface AuthenticatedRequest extends Request {
    user?: { userEmail: string };
}

async function check(user: string, ticketId: string) {

    const userInfo = await prisma.user.findUnique({
        where: { email: user }
    })
    const tiketInfo = await prisma.ticket.findUnique({
        where: { id: String(ticketId) }
    })
    const eventInfo = await prisma.event.findUnique({
        where: { id: String(tiketInfo?.eventId) }
    })
    if (userInfo?.id != eventInfo?.organiserId) {
        return false
    }
    return true
}

router.post('/issued/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { fullname } = req.body

        const user = req.user?.userEmail
        if(!(await check(String(user), String(id)))){
            return res.status(403).json({ status: 403, message: "ID юзера не зходиться з ID власника івенту" })
        }

        await prisma.ticket.update({
            where: { id: String(id) },
            data: { status: 'issued', userInitials: fullname }
        })

        return res.status(200).json({ status: 200 });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

router.post('/:status/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { status, id } = req.params;

        const user = req.user?.userEmail
        if(!(await check(String(user), String(id)))){
            return res.status(403).json({ status: 403, message: "ID юзера не зходиться з ID власника івенту" })
        }

        let curstatus;
        if (status === 'activated') {
            await prisma.ticket.update({
                where: { id: String(id) },
                data: { status: 'activated' }
            })
        } else if (status === 'created'){
            await prisma.ticket.update({
                where: { id: String(id) },
                data: { status: 'created' }
            })
        }else{
            return res.status(400).json({ status: 400, message: "Не коректний запит статуса" });
        }

        return res.status(200).json({ status: 200 });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ status: 500, message: "Внутрішня помилка сервера" })
    }
})

export default router;