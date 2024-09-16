import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const userId = req.query.id;
    if(req.method === 'GET') {
        const users = await prisma.user.findMany();
        res.status(200).json(users);
    } else if(req.method === 'POST') {
        const { email, password } = req.body;
        const user = await prisma.user.create({
            data: {
                email,
                password
            }
        });
        res.status(201).json(user);
    } else if(req.method === 'PUT') {
        const { email, password } = req.body;
        const user = await prisma.user.update({
            where: {
                id: Number(userId)
            },
            data: {
                email,
                password
            }
        });
        res.status(200).json(user);
    } else if(req.method === 'DELETE') {
        await prisma.user.delete({
            where: {
                id: Number(userId)
            }
        });
        res.status(200).json({ message: 'User deleted' });
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}