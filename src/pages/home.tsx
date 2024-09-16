import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
// import { withAuth } from '../hoc/withAuth';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
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
}

// export default withAuth(Home);