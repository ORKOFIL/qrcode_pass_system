import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from './lib/prisma.ts';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/auth/register', async (req: Request, res: Response) => {

    console.log("Created user:");
});

app.get('/auth/login', async (req: Request, res: Response) => {

    console.log("Created user:");
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});