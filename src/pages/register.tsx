import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from './components/Header';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      
      if(res.ok) {
        setSuccess('Usuário cadastrado com sucesso!');
        router.push('/login');
      }
      else {
        const errorMsg  = await res.json();
        setError(errorMsg.error);
      }
    } catch (error) {
      setError('Erro ao tentar cadastrar o usuário.');
    }
  };

  return (
    <div className="font-montserrat">
      <Head>
        <title>Cadastro</title>
      </Head>
      <Header />
      <div className="flex flex-col justify-top items-center min-h-screen mt-8">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl text-customBlack mb-4">Cadastro</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="form-group">
              <input
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <input
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition font-semibold">Cadastrar</button>
            {success ? success : error && <p>{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
