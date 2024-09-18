import type { NextApiRequest, NextApiResponse } from "next";
import openaiConfig from "../../lib/openaiConfig";
import formidable from "formidable";
import fs from "fs";

export const config = {
    api: {
        bodyParser: false,
    },
};

const parse = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    const form = new formidable.IncomingForm();
    return new Promise((resolve, reject) => {
        form.parse(req, (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { files } = await parse(req);
        const audioFile = files.audioFile;
        if (!audioFile || Array.isArray(audioFile)) {
            return res.status(400).json({ error: 'Invalid file upload' });
        }
        const file = audioFile as formidable.File;
        const transcriptionRes = await openaiConfig.audio.transcriptions.create({
            file: fs.createReadStream(file.filepath),
            model: "whisper-1"
        });
        const transcriptionText = transcriptionRes.text;

        return res.status(200).json({ transcriptionText });
    } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
    }
};