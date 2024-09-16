import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { token } = req.body;

  try {
    // Verifica e decodifica o token JWT usando Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    return res.status(200).json({ decodedToken });
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
