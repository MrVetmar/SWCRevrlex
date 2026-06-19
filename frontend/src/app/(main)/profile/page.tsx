'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { UserCircle, Target, Award, Edit2, X, Upload } from 'lucide-react';
import { translateTeamName } from '@/lib/countryTranslations';

interface Prediction {
  id: string;
  predictedWinner: 'HOME' | 'AWAY' | 'DRAW';
  predictedDifference: number;
  pointsAwarded: number;
  status: 'PENDING' | 'EVALUATED';
  match: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
  };
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/predictions');
        setPredictions(data.predictions);
      } catch (error) {
        console.error('Failed to fetch predictions', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setBioInput(user.bio || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('bio', bioInput);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      const { data } = await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      useAuthStore.getState().setUser(data.user);
      setIsEditing(false);
      setAvatarFile(null);
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Profil güncellenirken bir hata oluştu.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl">
        <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center border-4 border-zinc-700 overflow-hidden relative group">
          {user.avatarUrl ? (
            <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${user.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <UserCircle size={48} className="text-zinc-500" />
          )}
          <button onClick={() => setIsEditing(true)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Edit2 size={24} className="text-white" />
          </button>
        </div>
        <div className="flex-1 text-center md:text-left relative">
          <button 
            onClick={() => setIsEditing(true)}
            className="md:absolute right-0 top-0 p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2 text-sm max-md:mx-auto max-md:mb-4"
          >
            <Edit2 size={16} /> Profili Düzenle
          </button>
          <h1 className="text-3xl font-bold text-white mb-1">{user.username}</h1>
          <p className="text-zinc-400">{user.email}</p>
          {user.bio && <p className="text-sm text-zinc-300 mt-2 italic">"{user.bio}"</p>}
          <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-500/20">
              Rol: {user.role}
            </span>
          </div>
        </div>
        <div className="text-center bg-zinc-950 p-6 rounded-2xl border border-zinc-800 min-w-[150px]">
          <div className="text-sm font-medium text-zinc-400 mb-1">Toplam Puan</div>
          <div className="text-4xl font-black text-emerald-400">{user.totalPoints}</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Achievements Section */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="text-yellow-500" /> Başarımlar
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            {(!user.achievements || user.achievements.length === 0) ? (
              <div className="text-center text-zinc-500 py-4 text-sm">
                Henüz başarım yok. Doğru tahminler yaparak başarımların kilidini açın!
              </div>
            ) : (
              <div className="space-y-4">
                {user.achievements.map((ach: string, i: number) => (
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
            <Target className="text-blue-400" /> Tahmin Geçmişi
          </h2>
          
          {loading ? (
            <div className="text-zinc-500">Geçmiş yükleniyor...</div>
          ) : predictions.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
              Henüz hiç tahmin yapmadınız. Oynamaya başlamak için dashboard'a gidin!
            </div>
          ) : (
            <div className="space-y-4">
              {predictions.map((p) => (
                <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex-1 text-center sm:text-left">
                    <div className="text-sm font-bold text-white mb-1">
                      {translateTeamName(p.match.homeTeam)} vs {translateTeamName(p.match.awayTeam)}
                    </div>
                    <div className="text-xs text-zinc-400">
                      Gerçek Sonuç:{' '}
                      {p.match.status === 'FINISHED' 
                        ? (
                          <span className="font-bold">
                            <span className={
                              p.match.homeScore !== null && p.match.awayScore !== null 
                                ? p.match.homeScore < p.match.awayScore 
                                  ? "text-red-500" 
                                  : p.match.homeScore === p.match.awayScore 
                                    ? "text-zinc-500" 
                                    : "text-zinc-200"
                                : "text-zinc-200"
                            }>{p.match.homeScore}</span>
                            <span className={p.match.homeScore === p.match.awayScore ? "text-zinc-500 mx-1" : "text-zinc-200 mx-1"}>-</span>
                            <span className={
                              p.match.homeScore !== null && p.match.awayScore !== null 
                                ? p.match.awayScore < p.match.homeScore 
                                  ? "text-red-500" 
                                  : p.match.homeScore === p.match.awayScore 
                                    ? "text-zinc-500" 
                                    : "text-zinc-200"
                                : "text-zinc-200"
                            }>{p.match.awayScore}</span>
                          </span>
                        )
                        : 'Bekliyor'}
                    </div>
                  </div>
                  
                  <div className="bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800 text-center flex flex-col justify-center items-center">
                    <div className="text-xs text-zinc-500 mb-1">Sizin Tahmininiz</div>
                    <div className="font-bold text-white text-sm">
                      {p.predictedWinner === 'DRAW' ? 'Beraberlik' : 
                       p.predictedWinner === 'HOME' ? `${translateTeamName(p.match.homeTeam)} Kazanır` : 
                       `${translateTeamName(p.match.awayTeam)} Kazanır`}
                    </div>
                    {p.predictedWinner !== 'DRAW' && (
                      <div className="text-xs font-bold text-blue-400 mt-1">Fark: {p.predictedDifference}</div>
                    )}
                  </div>

                  <div className={`w-24 text-center px-3 py-2 rounded-xl font-bold ${
                    p.status === 'PENDING' ? 'bg-zinc-800 text-zinc-400' :
                    p.pointsAwarded > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {p.status === 'PENDING' ? 'Bekleniyor' : `+${p.pointsAwarded} PUAN`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">Profili Düzenle</h3>
              <button onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Profil Fotoğrafı</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 overflow-hidden shrink-0">
                    {avatarFile ? (
                      <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : user.avatarUrl ? (
                      <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${user.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={32} className="text-zinc-500" />
                    )}
                  </div>
                  <label className="flex-1 border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-zinc-800/50">
                    <Upload size={20} className="text-zinc-400 mb-2" />
                    <span className="text-xs text-zinc-400">Görsel Seç (Max 5MB)</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAvatarFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Hakkında (Bio)</label>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Kendinizden veya takımınızdan kısaca bahsedin..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-colors font-bold"
                >
                  {savingProfile ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
