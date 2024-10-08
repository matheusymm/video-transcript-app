import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Head from 'next/head';
import Header from './components/Header';

type Transcript = {
  id: number;
  name: string;
  status: string;
  transcript: string;
  completedAt: string;
};

type FormData = {
  file: FileList;
};

export default function Home() {
  const router = useRouter();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [error, setError] = useState<string>('');

  // Função para buscar as transcrições do usuário
  // useCallback é utilizado para evitar que a função seja recriada a cada renderização
  const fetchTranscripts = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.log("Token não encontrado. Redirecionando para a página de login.");
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/getTranscripts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if(!response.ok) {
        setError("Erro ao buscar transcrições.");
        return;
      }

      const data = await response.json();
      setTranscripts(data);
    } catch (error) {
      setError("Erro ao buscar transcrições.");
    } finally {
      setLoading(false);
    }
  } , [router]);

  useEffect(() => {
    fetchTranscripts();
  }, [fetchTranscripts]);

  const onSubmit = async (data: FormData) => {
    const formData = new FormData();
    formData.append('video', data.file[0]);

    const token = localStorage.getItem('token');

    if (!token) {
      console.log("Token não encontrado. Redirecionando para a página de login.");
      router.push("/login");
      return;
    }

    const response = await fetch('/api/createTranscript', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if(!response.ok) {
      const errorData = await response.json();
      if(response.status === 400) {
        if(errorData.error === 'Cota de transcrições excedida.'){
          setError('Cota de transcrições excedida. Tente novamente outro dia.');
        } else if(errorData.error === 'Formato de arquivo não suportado.'){
          setError('Formato de arquivo não suportado. Envie um arquivo de vídeo.');
        } else {
          setError('Nenhum arquivo enviado.');
        }
      } else {
        setError('Erro ao fazer upload do arquivo.');
      }
      return;
    }

    console.log("Upload realizado com sucesso!", await response.json());
    fetchTranscripts();
  };


  const handleLogout = async () => {
    // Logout do usuário
    await signOut(auth);

    // Remoção do token do Local Storage
    localStorage.removeItem('token');
    console.log("Logout realizado com sucesso!");
    router.push("/");
  };

  const handleDownload = async (id: number) => {
    const token = localStorage.getItem('token');

    // Faz um GET para obter o arquivo de transcrição
    const response = await fetch(`/api/downloadTranscript?id=${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    if(!response.ok) {
      const error = await response.json();
      console.log("Erro ao baixar o arquivo.", error);
      return;
    }
    
    // Converte a resposta em um blob (representação binária de um arquivo)
    const blob = await response.blob();

    // Cria um URL temporário para o download do arquivo
    const url = window.URL.createObjectURL(blob);

    // Cria um link temporário para o download do arquivo
    const link = document.createElement('a');

    // Define o link para o arquivo e o atributo de download
    link.href = url;

    // Define o nome do arquivo para download
    const name = transcripts.find((transcript) => transcript.id === id)?.name.split('.')[0] || 'transcript';
    link.setAttribute('download', `transcript_${name}.txt`);

    // Adiciona o link ao corpo do documento
    document.body.appendChild(link);

    // Simula o clique no link para iniciar o download
    link.click();

    // Remove o link do corpo do documento
    link.remove();
  }

  return (
    <div className="font-montserrat">
      <Head>
        <title>Home</title>
      </Head>
      <Header />
      <button onClick={handleLogout} className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition font-semibold">Logout</button>
      <div className="flex flex-col justify-top items-center min-h-screen mt-8">
      <h2 className="text-2xl text-customBlack mb-4">Upload de Arquivos</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mb-8 w-full max-w-md bg-white p-6 rounded-lg shadow-md">
          <input 
            type="file" 
            {...register('file')}
            accept='video/*,audio/*' // Aceita arquivos de vídeo e áudio
            multiple={false}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          {errors.file && <p>{errors.file.message}</p>}
          <button type="submit" className="w-full bg-blue-500 text-white py-2 mt-4 rounded-md hover:bg-blue-600 transition font-semibold">Upload</button>
        </form>
        <h2 className="text-2xl text-customBlack mb-4">Lista de Transcrições</h2>
        <div className="w-full max-w-4xl">
          {loading ? (
            <p>Carregando transcrições...</p>
          ) : (
            <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden text-center">
              <thead>
              <tr className="bg-customWhite border-b">
                <th className="px-4 py-2 border-r">Nome</th>
                <th className="px-4 py-2 border-r">Status</th>
                <th className="px-4 py-2 border-r">Data de Conclusão</th>
                <th className="px-4 py-2">Download</th>
              </tr>
              </thead>
              <tbody>
              {transcripts
              .map((transcript) => (
                <tr key={transcript.id} className="border-t border-b">
                <td className="px-4 py-2 border-r">{transcript.name}</td>
                <td className="px-4 py-2 border-r">
                  {transcript.status === 'Erro' ?
                  <span>Erro</span>
                  : transcript.status}
                </td>
                <td className="px-4 py-2 border-r">
                  {transcript.status === 'Erro' ? 
                  <span>Indefinido</span>
                  : transcript.completedAt ? 
                  (
                    new Date(transcript.completedAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  )
                  : 'Em processamento'}
                </td>
                <td>
                  {
                  transcript.status === 'Erro' ?
                  <span>Indisponível</span>
                  : transcript.status === 'Processando' ?
                  <span>Aguarde...</span>
                  : <button onClick={() => handleDownload(transcript.id)} className="w-100 bg-blue-500 text-white py-1 rounded-md hover:bg-blue-600 transition font-semibold">Download</button>
                  }  
                </td>
                </tr>
              ))}
              </tbody>
            </table>
          )}
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
};
