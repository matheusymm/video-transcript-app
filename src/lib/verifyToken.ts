import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";

export const verifyToken = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Obtém o token do cabeçalho da requisição
    const token = req.headers.authorization?.split("Bearer ")[1];
    
    if (!token) {
      throw new Error("Token não fornecido");
    }

    // Verifica o token com o Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    res.status(401).json({ message: "Token inválido", error: (error as Error).message });
    throw error;
  }
};