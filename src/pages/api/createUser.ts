import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { adminAuth } from '@/lib/firebaseAdmin';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  // Extrair email e senha do corpo da requisição
  const { email, password, confirmPassword } = req.body;
  if(!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  if(password !== confirmPassword) {
    return res.status(400).json({ error: 'Senhas diferentes' });
  }

  try {
    // Encripta a senha do usuário
    const saltRounds = 10;
    const encriptedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário no Firebase Authentication
    const userCredentials = await adminAuth.createUser({
      email,
      password,
    });

    // Salva o usuário no banco de dados
    const createdUser = await prisma.user.create({
      data: {
        id: userCredentials.uid,
        email: email,
        password: encriptedPassword,
        lastUsedAt: new Date(),
      },
    });

    return res.status(201).json({ message: 'Usuário criado com sucesso!', user: createdUser });
  } catch (error) {
    console.log("Erro ao criar usuário:", error);
    return res.status(400).json({ error: 'Erro ao criar usuário' });
  }
}
