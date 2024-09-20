import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import {IncomingForm, File, Files, Fields} from 'formidable';
import openai from '@/lib/openai';
import { verifyToken } from '@/lib/verifyToken';
import prisma from '@/lib/prisma';

// Configura o caminho do FFmpeg
if(ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
} else {
  console.error('FFmpeg não encontrado.');
  throw new Error('FFmpeg não encontrado.');
}

// Desabilitar o bodyParser para usar formidable no processamento da requisicão
export const config = {
  api: {
    bodyParser: false,
  },
};

// Função para converter video em audio usando FFmpeg
const convertVideoToAudio = async (videoPath: string, audioPath: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .format('mp3')
      .save(audioPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
  });
};

// Função para parsear o formulário com formidable
const parseForm = async (req: NextApiRequest): Promise<{fields: Fields, files: Files}> => {
  // Cria um diretório para salvar os arquivos
  const uploadDir = path.join(process.cwd(), 'public/uploads');

  // Configura o objeto IncomingForm
  const form = new IncomingForm({
    uploadDir: uploadDir,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 25MB
    multiples: false,
  });

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
};

const whisper = async (audioPath: string) => {
  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: fs.createReadStream(audioPath),
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });
  return transcription;
};

// Função para processar o vídeo de forma assíncrona
const processVideo = async (transcriptId: number, file: File) => {
  try {
    const filePath = file.filepath;
    const filename = file.originalFilename;

    const audioPath = path.join(path.dirname(filePath), `${filename}.mp3`);
    await convertVideoToAudio(filePath, audioPath);

    const transcription = await whisper(audioPath);

    await prisma.transcript.update({
      where: { id: transcriptId }, 
        data: {
          status: 'Concluído',
          text: transcription.text,
          completedAt: new Date(),
        }
    });

    await fsPromises.unlink(filePath);
    await fsPromises.unlink(audioPath);
  } catch (error) {
    console.error('Erro no processamento do vídeo: ', error);
    await prisma.transcript.update({
      where: { 
        id: transcriptId
      },
      data: { 
        status: 'Erro', 
      },
    });
  }
}

// Função principal para processar e transcrever o vídeo
export default async function POST(req: NextApiRequest, res: NextApiResponse) {
  if(req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ status: 'fail', error: 'Método não permitido.' });
  }

  try {
    // Verifica o token e autentica o usuário
    const decodedToken = await verifyToken(req, res);
    const userId = decodedToken.uid;

    // Verifica se o usuário existe e se a cota de transcrições não foi excedida
    const user = await prisma.user.findUnique({
      where: { 
        id: userId 
      },
    });

    if(!user) {
      return res.status(400).json({ status: 'fail', error: 'Usuário não encontrado.' });
    }

    // Atualiza a cota do usuário se o último uso foi há mais de 1 minuto
    const minTime = new Date(Date.now() - 24*60*60*1000);
    // const minTime = new Date(Date.now() - 60*1000);
    if(user.lastUsedAt && user.lastUsedAt < minTime) {
      await prisma.user.update({
        where: { 
          id: userId 
        },
        data: { 
          quota: 5,
          lastUsedAt: new Date(),
        },
      });
    }

    if(user.quota <= 0) {
      return res.status(400).json({ status: 'fail', error: 'Cota de transcrições excedida.' });
    }

    // Processa o formulário e o upload do video usando formidable
    const { files } = await parseForm(req);
    const fileArray = files.video as File[] | undefined;
    if (!fileArray || !fileArray.length) {
      return res.status(400).json({ status: 'fail', error: 'Nenhum arquivo enviado.' });
    }

    // Obtém o arquivo do array, no caso é apenas 1 arquivo
    const file = fileArray[0];

    // Verifica a extensão do arquivo
    const validExtensions = ['mp3', 'mp4', 'mov', 'avi', 'mkv', 'webm'];
    const fileExtension = path.extname(file.originalFilename || '').slice(1).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      return res.status(400).json({ status: 'fail', error: 'Formato de arquivo não suportado.' });
    }

    // Caminho onde o arquivo foi salvo
    const filePath = file.filepath;
    const filename = file.originalFilename;
    if (!filePath) {
      return res.status(400).json({ status: 'fail', error: 'Arquivo não encontrado.' });
    }

    // Salva o arquivo no banco de dados
    const savedTranscript = await prisma.transcript.create({
      data: {
        userId: userId,
        name: filename || 'untitled',
        status: 'Processando',
        text: '',
      },
    });

    // Atualiza a cota do usuário
    await prisma.user.update({
      where: { 
        id: userId 
      },
      data: { 
        quota: user.quota - 1 
      },
    });

    res.status(200).json({ 
      status: 'processing', 
      data: savedTranscript 
    });

    setTimeout(() => processVideo(savedTranscript.id, file), 0);

  } catch (error) {
    console.error('Erro ao iniciar o processamento: ', error);
    res.status(500).json({ status: 'fail', error: (error as Error).message });
  }
}