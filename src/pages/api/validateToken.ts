import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "../../lib/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.split("Bearer ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return res.status(200).json({ uid: decodedToken.uid, message: "Token válido" });
  } catch (error) {
    return res.status(401).json({ message: "Token inválido", error: (error as Error).message });
  }
}