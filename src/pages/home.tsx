import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';

export default function Home() {
  const router = useRouter();

  const verifyToken = async() => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.log("Token não encontrado. Redirecionando para a página de login.");
      router.push("/login");
    }

    try {
      const response = await fetch('/api/verifyToken', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if(response.ok) {
        console.log("Token válido.", data);
      } else {
        console.log("Erro na verificação do token. Redirecionando para a página de login.");
        router.push("/login");
      }
    } catch (error) {
      console.log("Erro na verificação do token. Redirecionando para a página de login.");
      router.push("/login");
    }
  };

  type FormData = {
    file: FileList;
  };
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    const formData = new FormData();
    formData.append('file', data.file[0]);

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
        <button onClick={verifyToken}>Token</button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="file" {...register('file')}/>
        {errors.file && <p>{errors.file.message}</p>}
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};
