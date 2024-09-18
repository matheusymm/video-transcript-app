import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "node:fs";
import fsPromise from "node:fs/promises";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import openai from "@/lib/openai";

export default async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if(!file) {
            return NextResponse.json({ status: "fail", error: "Nenhumm arquivo enviado." });
        }

        const validExtensions = ["mp4", "mov", "avi", "mkv", "webm"];

        if(!validExtensions.includes(file.type)) {
            return NextResponse.json({ status: "fail", error: "Formato de arquivo não suportado." });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const filePath = path.join(process.cwd(), '../../public/uploads/', file.name);
        await fsPromise.writeFile(filePath, buffer);

        const audioFilePath = path.join(process.cwd(), '../../public/uploads/', `${file.name}.mp3`);

        await fsPromise.writeFile(`../../public/uploads/${file.name}`, buffer);

        await new Promise((resolve, reject) => {
            ffmpeg(`../../public/uploads/${file.name}`)
                .output(audioFilePath)
                .noVideo()
                .format("mp3")
                .on("end", resolve)
                .on("error", reject)
                .run();
        });
    
        const transcription = await openai.audio.transcriptions.create({
            model: 'whisper-1',
            file: fs.createReadStream(audioFilePath),
            response_format: 'verbose_json',
            timestamp_granularities: ['word']
        });

        await fsPromise.unlink(filePath);
        await fsPromise.unlink(audioFilePath);

        revalidatePath("/home");
    
        return NextResponse.json({ 
            status: 'success',
            transcription: transcription.text,
        });
      } catch (e) {
        console.error(e);
        return NextResponse.json({ status: "fail", error: e });
      }
};