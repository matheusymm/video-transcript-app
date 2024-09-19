import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type Transcript = {
  id: string;
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
  }

  const handleLogout = async () => {
    // Logout do usuário
    await signOut(auth);

    // Remoção do token do Local Storage
    localStorage.removeItem('token');
    console.log("Logout realizado com sucesso!");
    router.push("/");
  };

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
          <ul>
            {transcripts.map((transcript) => (
              <li key={transcript.id}>
                <p>ID: {transcript.id}</p>
                <p>Nome: {transcript.name}</p>
                <p>Status: {transcript.status}</p>
                <p>Data de Conclusão: {transcript.completedAt}</p>
              </li>
            ))}
          </ul>
        )}
        {error && <p>{error}</p>}
      </div>
    </div>
  );
};
