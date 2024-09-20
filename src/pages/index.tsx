import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from './components/Header';

export default function Index() {
  const router = useRouter();

  return (
    <div className="font-montserrat">
      <Head>
        <title>Liven Transcription App</title>
        <meta name="description" content="Aplicação de Transcrição de Vídeos"/>
      </Head>
      <Header />
      <div className="flex flex-col justify-top items-center min-h-screen mt-8">
        <h2 className="text-2xl text-customBlack">Bem vindo!</h2>
        <div className="flex space-x-4 mt-4">
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
            onClick={() => router.push('/login')}
          >
            Login
          </button>
          <button 
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
            onClick={() => router.push('/register')}
          >
            Cadastro
          </button>
        </div>
      </div>
    </div>
  );
}
