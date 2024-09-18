import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    console.log("Logout realizado");
    router.push("/");
  };

  return (
    <div>
      <h1>Transcritor de Vídeos</h1>
      <h2>Lista de Transcrições</h2>
      <div>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};
