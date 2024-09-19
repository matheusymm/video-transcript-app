import { OpenAI } from 'openai';

// Cria uma instância do OpenAI com a chave de API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;