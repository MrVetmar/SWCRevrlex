'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const checkAuth = useAuthStore((state) => state.checkAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/login', { email, password });
      await checkAuth(); // Update global auth state
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Giriş yapılamadı');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Tekrar Hoş Geldiniz</h1>
          <p className="text-zinc-400">Dünya Kupası tahminlerinizi yapmak için giriş yapın</p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg text-center border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">E-posta</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresinizi girin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Şifre</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            Giriş Yap
          </button>
        </form>

        <p className="text-center text-zinc-400 text-sm">
          Hesabınız yok mu?{' '}
          <Link href="/register" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
            Buradan kayıt olun
          </Link>
        </p>
      </div>
    </div>
  );
}
