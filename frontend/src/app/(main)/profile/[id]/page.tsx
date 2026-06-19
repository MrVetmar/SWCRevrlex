'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { UserCircle, Target, Award } from 'lucide-react';
import { translateTeamName } from '@/lib/countryTranslations';

interface UserProfile {
  id: string;
  username: string;
  totalPoints: number;
  achievements: any;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  predictions: any[];
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get(`/users/${userId}`);
        setProfile(data.user);
      } catch (error) {
        console.error('Failed to fetch user profile', error);
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (loading) {
    return <div className="text-center text-zinc-500 py-10">Profil yükleniyor...</div>;
  }

  if (!profile) {
    return <div className="text-center text-red-500 py-10">Kullanıcı bulunamadı.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl">
        <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center border-4 border-zinc-700 overflow-hidden shrink-0">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${profile.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <UserCircle size={48} className="text-zinc-500" />
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-white mb-1">{profile.username}</h1>
          <p className="text-zinc-400 text-sm">Katılma: {new Date(profile.createdAt).toLocaleDateString()}</p>
          {profile.bio && <p className="text-sm text-zinc-300 mt-2 italic">"{profile.bio}"</p>}
        </div>
        <div className="text-center bg-zinc-950 p-6 rounded-2xl border border-zinc-800 min-w-[150px]">
          <div className="text-sm font-medium text-zinc-400 mb-1">Toplam Puan</div>
          <div className="text-4xl font-black text-blue-400">{profile.totalPoints}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Achievements Section */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="text-yellow-500" /> Başarımlar
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            {(!profile.achievements || profile.achievements.length === 0) ? (
              <div className="text-center text-zinc-500 py-4 text-sm">
                Henüz başarım yok.
              </div>
            ) : (
              <div className="space-y-4">
                {profile.achievements.map((ach: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <Award size={20} className="text-yellow-500" />
                    <span className="font-medium text-zinc-300">{ach.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Prediction History Section */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="text-emerald-400" /> Tahmin Geçmişi
          </h2>
          
          <div className="space-y-4">
            {profile.predictions.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
                Bu kullanıcı henüz hiç tahmin yapmamış.
              </div>
            ) : (
              profile.predictions.map((p) => {
                const now = new Date();
                const lockTime = new Date(new Date(p.match.startTime).getTime() - 15 * 60 * 1000);
                const isHidden = now < lockTime && p.match.status === 'SCHEDULED';

                return (
                  <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                          p.status === 'PENDING' ? 'bg-zinc-800 text-zinc-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {p.status === 'PENDING' ? 'BEKLİYOR' : 'DEĞERLENDİRİLDİ'}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white mb-1">
                        {translateTeamName(p.match.homeTeam)} vs {translateTeamName(p.match.awayTeam)}
                      </div>
                    </div>
                    
                    <div className="bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800 text-center flex flex-col justify-center items-center w-40">
                      <div className="text-xs text-zinc-500 mb-1">Tahmin</div>
                      {isHidden ? (
                        <div className="text-xs font-bold text-zinc-500 italic flex items-center gap-1">
                          Gizli (Maç Saati Bekleniyor)
                        </div>
                      ) : (
                        <>
                          <div className="font-bold text-white text-sm">
                            {p.predictedWinner === 'DRAW' ? 'Beraberlik' : 
                             p.predictedWinner === 'HOME' ? `${translateTeamName(p.match.homeTeam)} Kazanır` : 
                             `${translateTeamName(p.match.awayTeam)} Kazanır`}
                          </div>
                          {p.predictedWinner !== 'DRAW' && (
                            <div className="text-xs font-bold text-emerald-400 mt-1">Fark: {p.predictedDifference}</div>
                          )}
                        </>
                      )}
                    </div>

                    <div className={`w-24 text-center px-3 py-2 rounded-xl font-bold ${
                      p.status === 'PENDING' ? 'bg-zinc-800 text-zinc-400' :
                      p.pointsAwarded > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {p.status === 'PENDING' ? 'Bekleniyor' : `+${p.pointsAwarded} PUAN`}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
