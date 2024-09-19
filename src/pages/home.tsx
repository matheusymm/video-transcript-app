import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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

  const fetchTranscripts = async () => {
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
  };

  useEffect(() => {
    fetchTranscripts();
  }, []);

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
      console.log("Erro no upload do arquivo.", await response.json());
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
    link.setAttribute('download', `transcript_${id}.txt`);

    // Adiciona o link ao corpo do documento
    document.body.appendChild(link);

    // Simula o clique no link para iniciar o download
    link.click();

    // Remove o link do corpo do documento
    link.remove();
  }

  return (
    <div>
      <h1>Transcritor de Vídeos</h1>
      <h2>Lista de Transcrições</h2>
      <div>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input 
          type="file" 
          {...register('file')}
          accept='video/*'
          multiple={false}
        />
        {errors.file && <p>{errors.file.message}</p>}
        <button type="submit">Upload</button>
      </form>
      <div>
        {loading ? (
          <p>Carregando transcrições...</p>
        ) : (
          <table border={1}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Status</th>
                <th>Data de Conclusão</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {transcripts.map((transcript) => (
                <tr key={transcript.id}>
                  <td>{transcript.name}</td>
                  <td>{transcript.status}</td>
                  <td>{transcript.completedAt ? transcript.completedAt.toLocaleString() : 'Em processamento'}</td>
                  <td>
                    <button onClick={() => handleDownload(transcript.id)}>Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {error && <p>{error}</p>}
      </div>
    </div>
  );
};
