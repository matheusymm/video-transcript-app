import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from './components/Header';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        // Autenticação do usuário
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Obtenção do token de autenticação
        const token = await user.getIdToken();

        // Armazenamento do token no Local Storage
        localStorage.setItem('token', token);
        console.log("Login realizado com sucesso!");

        // Redirecionamento para a home
        router.push('/home');
    } catch (error) {
        setError('Email ou senha inválidos.');
    }
  };

  return (
    <div className="font-montserrat">
      <Head>
        <title>Login</title>
      </Head>
      <Header />
      <div className="flex flex-col justify-top items-center min-h-screen mt-8">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl text-customBlack mb-4">Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-group">
                <input
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="form-group">   
                <input
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition font-semibold">Entrar</button>
            {error && <p>{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
