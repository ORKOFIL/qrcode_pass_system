import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from './lib/prisma.ts';
import cors from 'cors';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import z from 'zod';
import { Prisma } from '@prisma/client';
import authRouter from './routers/auth.ts'

const app = express();
app.use(cors({
    origin: 'http://localhost:5173'
}));

const PORT = process.env.PORT || 3000;

app.use(express.json());

const requestTime = function (req: Request, res: Response, next: NextFunction) {
    console.log("ff");
    next();
};

app.use('/auth', authRouter);

app.use(requestTime);


app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});