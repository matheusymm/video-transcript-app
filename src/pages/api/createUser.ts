import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { email, password, displayName } = req.body;

  try {
    // Criar usuário no Firebase Authentication
    const user = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    return res.status(201).json({ user });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
}
