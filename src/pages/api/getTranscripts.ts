import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/verifyToken';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verifica o token enviado no cabeçalho da requisição
    const decodedToken = await verifyToken(req, res);
    const userId = decodedToken.uid;

    // Busca as transcrições do banco de dados associadas ao usuário e ordena de forma decrescente em relação a data de conclusão
    const transcriptions = await prisma.transcript.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    return res.status(200).json(transcriptions);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar transcrições.', error: (error as Error).message });
  }
}
