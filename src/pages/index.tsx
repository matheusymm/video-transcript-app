import { useRouter } from 'next/router';

export default function Index() {
  const router = useRouter();

  return (
    <div>
      <h1>Bem-vindo à Página Inicial</h1>
      <div>
        <button onClick={() => router.push('/login')}>Login</button>
        <button onClick={() => router.push('/register')}>Cadastro</button>
      </div>
    </div>
  );
}
