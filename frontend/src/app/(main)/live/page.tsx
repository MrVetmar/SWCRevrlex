'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Activity, Clock, Eye, X, UserCircle } from 'lucide-react';
import api from '@/lib/axios';
import { translateTeamName } from '@/lib/countryTranslations';
import Link from 'next/link';

interface Match {
  id: string | number;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string;
  awayCrest?: string;
  startTime: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'SCHEDULED' | 'IN_PLAY' | 'FINISHED';
  minute?: string | null;
  predictionStats?: {
    total: number;
    homePercent: number;
    awayPercent: number;
    drawPercent: number;
  } | null;
}

export default function LiveMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Other Predictions State
  const [viewingPredictionsFor, setViewingPredictionsFor] = useState<number | null>(null);
  const [matchPredictions, setMatchPredictions] = useState<any[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  useEffect(() => {
    // We connect to the backend socket
    const socket = io('http://localhost:5000', {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Connected to Live Match server');
    });

    socket.on('match_update', (updatedMatches: Match[]) => {
      // The backend emits an array of the matches it just updated.
      // We will merge this into our current state.
      setMatches(prevMatches => {
        const newMatches = [...prevMatches];
        for (const up of updatedMatches) {
          const idx = newMatches.findIndex(m => m.id === up.id);
          if (idx !== -1) {
            newMatches[idx] = up;
          } else {
            newMatches.push(up);
          }
        }
        return newMatches;
      });
    });

    api.get('/matches')
      .then(res => {
        if (res.data.matches) {
          setMatches(res.data.matches);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to fetch initial matches:', err);
        setLoading(false);
      });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleViewPredictions = async (matchId: number) => {
    setViewingPredictionsFor(matchId);
    setLoadingPredictions(true);
    setMatchPredictions([]);
    try {
      const { data } = await api.get(`/predictions/match/${matchId}`);
      setMatchPredictions(data.predictions);
    } catch (error) {
      console.error('Failed to fetch match predictions', error);
      alert('Tahminleri çekerken bir hata oluştu.');
      setViewingPredictionsFor(null);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const liveMatches = matches.filter(m => m.status === 'IN_PLAY');
  const todayScheduled = matches.filter(m => {
    if (m.status !== 'SCHEDULED') return false;
    const matchDate = new Date(m.startTime).toDateString();
    const today = new Date().toDateString();
    return matchDate === today;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Activity className="text-red-500 animate-pulse" /> Canlı Maçlar
        </h1>
        <p className="text-zinc-400">Şu an oynanan ve bugün başlayacak maçları buradan takip edin.</p>
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 py-10">Canlı maç verisi bekleniyor...</div>
      ) : (
        <div className="space-y-8">
          {/* LIVE MATCHES */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 border-b border-zinc-800 pb-2">Şu An Oynananlar</h2>
            {liveMatches.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
                Şu an canlı oynanan bir maç bulunmuyor.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveMatches.map(match => (
                  <div key={match.id} className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold px-2 py-1 bg-red-500/10 text-red-500 rounded flex items-center gap-1 animate-pulse">
                        <Activity size={12} /> {match.minute || 'CANLI'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1 flex flex-col items-center gap-1">
                        {match.homeCrest && <img src={match.homeCrest} alt={translateTeamName(match.homeTeam)} className="w-8 h-8 object-contain" />}
                        <div className="text-lg font-bold text-white">{translateTeamName(match.homeTeam)}</div>
                      </div>
                      <div className="px-4 text-3xl font-black tracking-widest bg-zinc-950 py-2 rounded-xl border border-zinc-800">
                        <span className={
                          match.homeScore !== null && match.awayScore !== null 
                            ? match.homeScore < match.awayScore 
                              ? "text-red-500" 
                              : match.homeScore === match.awayScore 
                                ? "text-zinc-500" 
                                : "text-white"
                            : "text-white"
                        }>
                          {match.homeScore}
                        </span>
                        <span className={match.homeScore === match.awayScore ? "text-zinc-500 mx-2" : "text-white mx-2"}>-</span>
                        <span className={
                          match.homeScore !== null && match.awayScore !== null 
                            ? match.awayScore < match.homeScore 
                              ? "text-red-500" 
                              : match.homeScore === match.awayScore 
                                ? "text-zinc-500" 
                                : "text-white"
                            : "text-white"
                        }>
                          {match.awayScore}
                        </span>
                      </div>
                      <div className="text-center flex-1 flex flex-col items-center gap-1">
                        {match.awayCrest && <img src={match.awayCrest} alt={translateTeamName(match.awayTeam)} className="w-8 h-8 object-contain" />}
                        <div className="text-lg font-bold text-white">{translateTeamName(match.awayTeam)}</div>
                      </div>
                    </div>

                    {match.predictionStats && (
                      <div className="mt-6 pt-4 border-t border-zinc-800">
                        <div className="flex justify-between text-xs text-zinc-400 mb-2">
                          <span>Topluluk Tahminleri ({match.predictionStats.total} Kişi)</span>
                        </div>
                        <div className="h-2 w-full flex rounded-full overflow-hidden bg-zinc-800">
                          {match.predictionStats.homePercent > 0 && (
                            <div style={{ width: `${match.predictionStats.homePercent}%` }} className="bg-blue-500" title={`${translateTeamName(match.homeTeam)}: %${match.predictionStats.homePercent}`}></div>
                          )}
                          {match.predictionStats.drawPercent > 0 && (
                            <div style={{ width: `${match.predictionStats.drawPercent}%` }} className="bg-zinc-500" title={`Beraberlik: %${match.predictionStats.drawPercent}`}></div>
                          )}
                          {match.predictionStats.awayPercent > 0 && (
                            <div style={{ width: `${match.predictionStats.awayPercent}%` }} className="bg-red-500" title={`${translateTeamName(match.awayTeam)}: %${match.predictionStats.awayPercent}`}></div>
                          )}
                        </div>
                        <div className="flex justify-between text-[10px] mt-1 text-zinc-500 font-bold px-1">
                          <span className={match.predictionStats.homePercent >= match.predictionStats.awayPercent && match.predictionStats.homePercent >= match.predictionStats.drawPercent ? "text-blue-400" : ""}>%{match.predictionStats.homePercent} {translateTeamName(match.homeTeam)}</span>
                          <span className={match.predictionStats.drawPercent >= match.predictionStats.homePercent && match.predictionStats.drawPercent >= match.predictionStats.awayPercent ? "text-zinc-300" : ""}>%{match.predictionStats.drawPercent} Beraberlik</span>
                          <span className={match.predictionStats.awayPercent >= match.predictionStats.homePercent && match.predictionStats.awayPercent >= match.predictionStats.drawPercent ? "text-red-400" : ""}>%{match.predictionStats.awayPercent} {translateTeamName(match.awayTeam)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SCHEDULED TODAY */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 border-b border-zinc-800 pb-2">Bugün Oynanacaklar</h2>
            {todayScheduled.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
                Bugün planlanmış başka maç bulunmuyor.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayScheduled.map(match => (
                  <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock size={12} /> Bekleniyor
                      </span>
                      <span className="text-xs text-blue-400 font-mono">
                        {new Date(match.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1 flex flex-col items-center gap-1">
                        {match.homeCrest && <img src={match.homeCrest} alt={translateTeamName(match.homeTeam)} className="w-8 h-8 object-contain" />}
                        <div className="text-lg font-bold text-zinc-300">{translateTeamName(match.homeTeam)}</div>
                      </div>
                      <div className="px-4 text-xl font-bold text-zinc-600">
                        VS
                      </div>
                      <div className="text-center flex-1 flex flex-col items-center gap-1">
                        {match.awayCrest && <img src={match.awayCrest} alt={translateTeamName(match.awayTeam)} className="w-8 h-8 object-contain" />}
                        <div className="text-lg font-bold text-zinc-300">{translateTeamName(match.awayTeam)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Kim Ne Dedi Modal */}
      {viewingPredictionsFor && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Eye className="text-emerald-400" /> Diğer Tahminler
              </h3>
              <button onClick={() => setViewingPredictionsFor(null)} className="text-zinc-400 hover:text-white p-1 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {loadingPredictions ? (
                <div className="text-center text-zinc-500 py-8">Yükleniyor...</div>
              ) : matchPredictions.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">Bu maça henüz kimse tahmin yapmamış.</div>
              ) : (
                matchPredictions.map((pred: any) => (
                  <div key={pred.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center gap-4">
                    <Link href={`/profile/${pred.user.id}`} className="shrink-0 group">
                      <div className="w-10 h-10 bg-zinc-800 rounded-full border border-zinc-700 overflow-hidden group-hover:border-emerald-500 transition-colors">
                        {pred.user.avatarUrl ? (
                          <img src={pred.user.avatarUrl.startsWith('http') || pred.user.avatarUrl.startsWith('data:') ? pred.user.avatarUrl : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${pred.user.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle size={40} className="text-zinc-500 -ml-[1px] -mt-[1px]" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${pred.user.id}`} className="text-sm font-bold text-white hover:text-emerald-400 transition-colors truncate block">
                        {pred.user.username}
                      </Link>
                      <div className="text-xs text-zinc-400 mt-1">
                        {pred.predictedWinner === 'DRAW' ? 'Beraberlik' : `${pred.predictedWinner === 'HOME' ? 'Ev Sahibi' : 'Deplasman'} Kazanır`}
                        {pred.predictedWinner !== 'DRAW' && <span className="ml-1 text-emerald-400 font-bold">(Fark: {pred.predictedDifference})</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
