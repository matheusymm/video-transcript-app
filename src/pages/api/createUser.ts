import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '../../lib/firebaseAdmin';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { email, password } = req.body;

  if(!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    // Criar usuário no Firebase Authentication
    const userCredentials = await adminAuth.createUser({
      email,
      password,
    });

    // Criar usuário no banco de dados
    const createdUser = await prisma.user.create({
      data: {
        id: userCredentials.uid,
        email,
        password,
      },
    });

    return res.status(201).json({ message: 'Usuário criado com sucesso!', user: createdUser });
  } catch (error) {
    console.log("Erro ao criar usuário:", error);
    return res.status(400).json({ error: 'Erro ao criar usuário' });
  }
}
