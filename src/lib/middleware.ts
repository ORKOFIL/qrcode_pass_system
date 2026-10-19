import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
    user?: { userEmail: string };
}

export const middleware = function (req: AuthenticatedRequest, res: Response, next: NextFunction) {
    console.log('middleware')
    const authHeader = req.headers.authorization
    
    if (!authHeader) {
        console.log("Токен відсутній")
        return res.status(401).json({ message: "Токен відсутній" });
    }
    const token = authHeader!.split(' ')[1];
    try {
        const decoded = jwt.verify(token!, process.env.JWT_ACCESS_SECRET!) as { userEmail: string, isStaff: boolean | undefined }
        
        req.user = decoded
        console.log(decoded.userEmail)
        next();
    } catch (error) {
        console.log("Токен невірний або застарілий")
        return res.status(401).json({ message: "Токен невірний або застарілий" });
    }
};