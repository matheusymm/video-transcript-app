import { OpenAI } from 'openai';

const openaiConfig = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openaiConfig;