import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/verifyToken";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed.' });
    }

    try {
        // Verifica o token e autentica o usuário
        const decodedToken = await verifyToken(req, res);
        const userId = decodedToken.uid;

        // Busca o id da transcrição na query da requisição
        const { id } = req.query;

        // Converte o id para um número inteiro
        const transcriptId = Array.isArray(id) ? parseInt(id[0], 10) : parseInt(id as string, 10);

        // Busca a transcrição no banco de dados associada ao usuário
        const transcript = await prisma.transcript.findFirst({
            where: {
                id: transcriptId,
                userId: userId,
                status: 'Concluído',
            },
        });

        if (!transcript) {
            return res.status(404).json({ message: 'Transcrição não encotrada.' });
        }

        // Retorna a transcrição como um arquivo de texto
        const fileName = `${transcript.id}_${transcript.name}.txt`;

        // Define os headers da resposta
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'text/plain');

        // Envia a transcrição como resposta
        res.status(200).send(transcript.text);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao buscar transcrição.' });
    }
};