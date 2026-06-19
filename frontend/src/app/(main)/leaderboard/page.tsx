'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { io } from 'socket.io-client';
import { Trophy, Medal, UserCircle } from 'lucide-react';
import Link from 'next/link';

interface UserScore {
  id: string;
  username: string;
  totalPoints: number;
  avatarUrl?: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();

    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(socketUrl, { withCredentials: true });

    socket.on('leaderboard_update', (updatedLeaderboard: UserScore[]) => {
      setLeaderboard(updatedLeaderboard);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await api.get('/leaderboard');
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Failed to fetch leaderboard', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-zinc-500 py-10">Liderlik tablosu yükleniyor...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-yellow-500/10 rounded-full mb-4">
          <Trophy size={48} className="text-yellow-500" />
        </div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Küresel Sıralama</h1>
        <p className="text-zinc-400">Doğru tahminlere dayalı canlı puanlar</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider bg-zinc-950/50">
          <div className="col-span-2 text-center">Sıra</div>
          <div className="col-span-7">Oyuncu</div>
          <div className="col-span-3 text-right pr-4">Puan</div>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {leaderboard.map((user, index) => {
            const isTop3 = index < 3;
            const rankColors = [
              'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', // 1st
              'text-zinc-300 bg-zinc-300/10 border-zinc-300/20',       // 2nd
              'text-amber-600 bg-amber-600/10 border-amber-600/20'     // 3rd
            ];

            return (
              <div key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-zinc-800/30 transition-colors">
                <div className="col-span-2 flex justify-center">
                  {isTop3 ? (
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${rankColors[index]}`}>
                      <Medal size={16} />
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-zinc-600">{index + 1}</span>
                  )}
                </div>
                
                <div className="col-span-7">
                  <Link href={`/profile/${user.id}`} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full border border-zinc-700 overflow-hidden shrink-0 group-hover:border-blue-500 transition-colors">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={40} className="text-zinc-500 -ml-[1px] -mt-[1px]" />
                      )}
                    </div>
                    <div className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {user.username}
                    </div>
                  </Link>
                </div>
                
                <div className="col-span-3 text-right pr-4">
                  <span className="text-2xl font-black text-blue-400">{user.totalPoints}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
