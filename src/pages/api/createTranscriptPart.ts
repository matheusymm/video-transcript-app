import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { IncomingForm, File, Files, Fields } from 'formidable';
import openai from '@/lib/openai';
import { verifyToken } from '@/lib/verifyToken';
import prisma from '@/lib/prisma';

// Configura o caminho do FFmpeg
if (ffmpegPath) {
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
      .audioCodec('pcm_s16le')
      .format('wav')
      .save(audioPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
};

// Função para parsear o formulário com formidable
const parseForm = async (req: NextApiRequest): Promise<{ fields: Fields, files: Files }> => {
  // Cria um diretório para salvar os arquivos
  const uploadDir = path.join(process.cwd(), 'public/uploads');

  // Configura o objeto IncomingForm
  const form = new IncomingForm({
    uploadDir: uploadDir,
    keepExtensions: true,
    maxFileSize: 100 * 1024 * 1024, // 100MB
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

// Função para dividir o áudio em segmentos de duração específica (em segundos)
const splitAudio = async (audioPath: string, segmentDuration: number): Promise<string[]> => {
  return new Promise<string[]>((resolve, reject) => {
    const outputDir = path.dirname(audioPath);
    const fileNameWithoutExt = path.parse(audioPath).name;
    const segmentPattern = path.join(outputDir, `${fileNameWithoutExt}_segment_%03d.wav`);

    ffmpeg(audioPath)
      .output(segmentPattern)
      .duration(segmentDuration)
      .on('end', async () => {
        try {
          const files = await fsPromises.readdir(outputDir);
          const segmentFiles = files
            .filter(file => file.startsWith(`${fileNameWithoutExt}_segment_`) && file.endsWith('.wav'))
            .map(file => path.join(outputDir, file))
            .sort(); // Ordena para manter a sequência correta
          resolve(segmentFiles);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => reject(err))
      .run();
  });
};

// Função para transcrever um segmento de áudio
const transcribeSegment = async (segmentPath: string): Promise<string> => {
  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: fs.createReadStream(segmentPath),
    response_format: 'text', // Preferível para concatenação
  });

  return transcription.text;
};

// Função para processar todos os segmentos e combinar as transcrições
const processSegments = async (segmentPaths: string[], transcriptId: number) => {
  try {
    let fullTranscription = '';

    for (const segmentPath of segmentPaths) {
      const segmentTranscription = await transcribeSegment(segmentPath);
      fullTranscription += segmentTranscription + ' ';
      // Excluir o segmento após transcrição
      await fsPromises.unlink(segmentPath);
    }

    // Atualiza a transcrição completa no banco de dados
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: {
        status: 'Concluído',
        text: fullTranscription.trim(),
        completedAt: new Date(),
      },
    });

    // Excluir o arquivo de áudio original após transcrição
    const originalAudioPath = path.join(path.dirname(segmentPaths[0]), `${path.parse(segmentPaths[0]).name.split('_segment_')[0]}.wav`);
    await fsPromises.unlink(originalAudioPath);
  } catch (error) {
    console.error('Erro na transcrição dos segmentos:', error);
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: { status: 'Erro' },
    });
  }
};

// Função para processar o vídeo de forma assíncrona
const processVideo = async (transcriptId: number, file: File) => {
  try {
    const filePath = file.filepath;
    const filename = file.originalFilename;

    const audioPath = path.join(path.dirname(filePath), `${filename}.wav`);
    await convertVideoToAudio(filePath, audioPath);

    // Definir a duração dos segmentos em segundos (exemplo: 5 minutos)
    const segmentDuration = 300; // 5 minutos

    // Dividir o áudio em segmentos
    const segmentPaths = await splitAudio(audioPath, segmentDuration);

    if (segmentPaths.length === 0) {
      throw new Error('Nenhum segmento criado.');
    }

    // Transcrever os segmentos e combinar as transcrições
    await processSegments(segmentPaths, transcriptId);
  } catch (error) {
    console.error('Erro no processamento do vídeo:', error);
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: { status: 'Erro' },
    });
  }
};

// Função principal para processar e transcrever o vídeo
export default async function POST(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ status: 'fail', error: 'Método não permitido.' });
  }

  try {
    // Verifica o token e autentica o usuário
    const decodedToken = await verifyToken(req, res);
    const userId = decodedToken.uid;

    // Verifica se o usuário existe e se a cota de transcrições não foi excedida
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res.status(404).json({ status: 'fail', error: 'Usuário não encontrado.' });
    }
    if (user.quota <= 0) {
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

    // Salva o arquivo no banco de dados com status 'Processando'
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
      where: { id: userId },
      data: { quota: user.quota - 1 },
    });

    res.status(200).json({ 
      status: 'processing', 
      data: savedTranscript 
    });

    // Processar o vídeo assincronamente
    setTimeout(() => processVideo(savedTranscript.id, file), 0);

  } catch (error) {
    console.error('Erro ao iniciar o processamento:', error);
    res.status(500).json({ status: 'fail', error: (error as Error).message });
  }
}
