import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import { useRouter } from 'next/router';

export default function Index() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div>
      <h1>Bem-vindo à Página Inicial</h1>
      <div>
        <button onClick={() => router.push('/login')}>Login</button>
        <button onClick={() => router.push('/register')}>Cadastro</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
