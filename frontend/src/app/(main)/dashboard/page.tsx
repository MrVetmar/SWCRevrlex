'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Trophy, Clock, Lock, Eye, X, UserCircle } from 'lucide-react';
import { translateTeamName, translateStatus } from '@/lib/countryTranslations';
import Link from 'next/link';

interface Match {
  id: string | number;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string;
  awayCrest?: string;
  startTime: string;
  status: 'SCHEDULED' | 'IN_PLAY' | 'FINISHED';
  homeScore: number | null;
  awayScore: number | null;
}

export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for predictions
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [predictedDifference, setPredictedDifference] = useState<number>(1);
  const [predictedWinner, setPredictedWinner] = useState<'HOME' | 'AWAY' | 'DRAW'>('HOME');
  const [submitMessage, setSubmitMessage] = useState('');

  // Other Predictions State
  const [viewingPredictionsFor, setViewingPredictionsFor] = useState<number | null>(null);
  const [matchPredictions, setMatchPredictions] = useState<any[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const { data } = await api.get('/matches');
      setMatches(data.matches);
    } catch (error) {
      console.error('Failed to fetch matches', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async (matchId: number) => {
    try {
      await api.post('/predictions', {
        matchId,
        predictedDifference: predictedWinner === 'DRAW' ? 0 : predictedDifference,
        predictedWinner,
      });
      setSubmitMessage('Tahmin kaydedildi!');
      setTimeout(() => setSubmitMessage(''), 3000);
      setSelectedMatchId(null);
    } catch (error: any) {
      setSubmitMessage(error.response?.data?.error || 'Tahmin kaydedilemedi');
      setTimeout(() => setSubmitMessage(''), 3000);
    }
  };

  const handleViewPredictions = async (matchId: number) => {
    setViewingPredictionsFor(matchId);
    setLoadingPredictions(true);
    setMatchPredictions([]);
    try {
      const { data } = await api.get(`/predictions/match/${matchId}`);
      setMatchPredictions(data.predictions);
    } catch (error) {
      console.error('Failed to fetch match predictions', error);
      alert('Tahminler henüz gizli.');
      setViewingPredictionsFor(null);
    } finally {
      setLoadingPredictions(false);
    }
  };

  if (loading) {
    return <div className="text-center text-zinc-500 py-10">Maçlar yükleniyor...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dünya Kupası Maçları</h1>
        <p className="text-zinc-400">Maçlar kilitlenmeden (başlamasına 15 dk kala) tahminlerinizi yapın.</p>
      </div>

      {submitMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center">
          {submitMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matches.map((match) => {
          const isLocked = match.status !== 'SCHEDULED' || new Date(match.startTime).getTime() - Date.now() < 15 * 60 * 1000;
          const isSelected = selectedMatchId === match.id;

          return (
            <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
              <div className="p-4 bg-zinc-800/30 flex justify-between items-center border-b border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Clock size={16} />
                  {new Date(match.startTime).toLocaleString()}
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-md ${
                  match.status === 'FINISHED' ? 'bg-zinc-800 text-zinc-300' : 
                  match.status === 'IN_PLAY' ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {translateStatus(match.status)}
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-center flex-1 flex flex-col items-center gap-2">
                    {match.homeCrest && (
                      <img src={match.homeCrest} alt={translateTeamName(match.homeTeam)} className="w-12 h-12 object-contain" />
                    )}
                    <div className="text-2xl font-bold text-white">{translateTeamName(match.homeTeam)}</div>
                  </div>
                  <div className="px-4 text-center">
                    {match.status === 'SCHEDULED' ? (
                      <span className="text-xl font-bold text-zinc-600">VS</span>
                    ) : (
                      <span className="text-3xl font-black">
                        <span className={
                          match.homeScore !== null && match.awayScore !== null 
                            ? match.homeScore < match.awayScore 
                              ? "text-red-500" 
                              : match.homeScore === match.awayScore 
                                ? "text-zinc-500" 
                                : "text-emerald-400"
                            : "text-emerald-400"
                        }>
                          {match.homeScore}
                        </span>
                        <span className={match.homeScore === match.awayScore ? "text-zinc-500 mx-2" : "text-emerald-400 mx-2"}>-</span>
                        <span className={
                          match.homeScore !== null && match.awayScore !== null 
                            ? match.awayScore < match.homeScore 
                              ? "text-red-500" 
                              : match.homeScore === match.awayScore 
                                ? "text-zinc-500" 
                                : "text-emerald-400"
                            : "text-emerald-400"
                        }>
                          {match.awayScore}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="text-center flex-1 flex flex-col items-center gap-2">
                    {match.awayCrest && (
                      <img src={match.awayCrest} alt={translateTeamName(match.awayTeam)} className="w-12 h-12 object-contain" />
                    )}
                    <div className="text-2xl font-bold text-white">{translateTeamName(match.awayTeam)}</div>
                  </div>
                </div>

                {!isLocked && !isSelected && (
                  <button
                    onClick={() => setSelectedMatchId(match.id)}
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Tahmin Yap
                  </button>
                )}

                {isLocked && match.status === 'SCHEDULED' && (
                  <div className="w-full py-3 bg-zinc-950 text-zinc-500 font-medium rounded-xl flex items-center justify-center gap-2 border border-zinc-800">
                    <Lock size={16} /> Kilitlendi (Yakında başlayacak)
                  </div>
                )}

                {isLocked && (
                  <button
                    onClick={() => handleViewPredictions(match.id as number)}
                    className="mt-2 w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-medium rounded-xl flex items-center justify-center gap-2 border border-blue-500/20 transition-colors"
                  >
                    <Eye size={16} /> Kim Ne Dedi?
                  </button>
                )}

                {isSelected && (
                  <div className="mt-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setPredictedWinner('HOME')}
                        className={`py-2 rounded-lg font-bold text-sm transition-colors ${
                          predictedWinner === 'HOME' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                        }`}
                      >
                        {translateTeamName(match.homeTeam)}
                      </button>
                      <button
                        onClick={() => setPredictedWinner('DRAW')}
                        className={`py-2 rounded-lg font-bold text-sm transition-colors ${
                          predictedWinner === 'DRAW' ? 'bg-zinc-600 text-white' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                        }`}
                      >
                        Berabere
                      </button>
                      <button
                        onClick={() => setPredictedWinner('AWAY')}
                        className={`py-2 rounded-lg font-bold text-sm transition-colors ${
                          predictedWinner === 'AWAY' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                        }`}
                      >
                        {translateTeamName(match.awayTeam)}
                      </button>
                    </div>

                    {predictedWinner !== 'DRAW' && (
                      <div className="flex flex-col items-center gap-2">
                        <label className="text-xs text-zinc-500">Kaç Farkla Kazanır?</label>
                        <input
                          type="number"
                          min="1"
                          value={predictedDifference}
                          onChange={(e) => {
                            const diff = parseInt(e.target.value) || 1;
                            setPredictedDifference(diff);
                          }}
                          className="w-24 text-center py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-bold"
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setSelectedMatchId(null)}
                        className="flex-1 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        onClick={() => handlePredict(match.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                      >
                        Kaydet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kim Ne Dedi Modal */}
      {viewingPredictionsFor && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Eye className="text-blue-400" /> Diğer Tahminler
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
                      <div className="w-10 h-10 bg-zinc-800 rounded-full border border-zinc-700 overflow-hidden group-hover:border-blue-500 transition-colors">
                        {pred.user.avatarUrl ? (
                          <img src={pred.user.avatarUrl.startsWith('http') ? pred.user.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${pred.user.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle size={40} className="text-zinc-500 -ml-[1px] -mt-[1px]" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${pred.user.id}`} className="text-sm font-bold text-white hover:text-blue-400 transition-colors truncate block">
                        {pred.user.username}
                      </Link>
                      <div className="text-xs text-zinc-400 mt-1">
                        {pred.predictedWinner === 'DRAW' ? 'Beraberlik' : `${pred.predictedWinner === 'HOME' ? 'Ev Sahibi' : 'Deplasman'} Kazanır`}
                        {pred.predictedWinner !== 'DRAW' && <span className="ml-1 text-blue-400 font-bold">(Fark: {pred.predictedDifference})</span>}
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
