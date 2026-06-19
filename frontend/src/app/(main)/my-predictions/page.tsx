'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Clock, Lock, CheckCircle2 } from 'lucide-react';
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

interface Prediction {
  id: string | number;
  matchId: number;
  predictedWinner: 'HOME' | 'AWAY' | 'DRAW';
  predictedDifference: number;
  pointsAwarded: number | null;
  match: Match;
}

export default function MyPredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for predictions
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [predictedDifference, setPredictedDifference] = useState<number>(1);
  const [predictedWinner, setPredictedWinner] = useState<'HOME' | 'AWAY' | 'DRAW'>('HOME');
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    fetchMyPredictions();
  }, []);

  const fetchMyPredictions = async () => {
    try {
      const { data } = await api.get('/predictions');
      setPredictions(data.predictions);
    } catch (error) {
      console.error('Failed to fetch predictions', error);
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
      setSubmitMessage('Tahmin başarıyla güncellendi!');
      setTimeout(() => setSubmitMessage(''), 3000);
      setSelectedMatchId(null);
      fetchMyPredictions(); // Refresh the list to show updated prediction
    } catch (error: any) {
      setSubmitMessage(error.response?.data?.error || 'Tahmin güncellenemedi');
      setTimeout(() => setSubmitMessage(''), 3000);
    }
  };

  const openEdit = (prediction: Prediction) => {
    setSelectedMatchId(prediction.matchId);
    setPredictedWinner(prediction.predictedWinner);
    setPredictedDifference(prediction.predictedDifference || 1);
  };

  if (loading) {
    return <div className="text-center text-zinc-500 py-10">Tahminleriniz yükleniyor...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Tahminlerim</h1>
        <p className="text-zinc-400">Oynadığınız maçları buradan takip edebilir ve kilitlenene kadar düzenleyebilirsiniz.</p>
      </div>

      {submitMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`px-6 py-3 rounded-xl shadow-2xl border font-medium flex items-center gap-2 ${
            submitMessage.includes('hata') || submitMessage.includes('emedi')
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-emerald-500/90 backdrop-blur-md border-emerald-400/20 text-white'
          }`}>
            {submitMessage}
          </div>
        </div>
      )}

      {predictions.length === 0 ? (
        <div className="text-center p-12 bg-zinc-900 border border-zinc-800 rounded-3xl">
          <p className="text-zinc-400 mb-4">Henüz hiçbir maça tahmin yapmadınız.</p>
          <Link href="/dashboard" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors inline-block">
            Maçlara Göz At
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {predictions.map((prediction) => {
            const match = prediction.match;
            const isLocked = match.status !== 'SCHEDULED' || new Date(match.startTime).getTime() - Date.now() < 15 * 60 * 1000;
            const isSelected = selectedMatchId === match.id;

            return (
              <div key={prediction.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors flex flex-col">
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

                <div className="p-6 flex-1 flex flex-col">
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

                  {/* Current Prediction Display */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-blue-500/20 mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-blue-400 font-bold mb-1 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Mevcut Tahmininiz
                      </div>
                      <div className="text-white font-medium text-sm">
                        {prediction.predictedWinner === 'DRAW' ? (
                          'Berabere Biter'
                        ) : (
                          <>
                            <span className="text-emerald-400">{translateTeamName(prediction.predictedWinner === 'HOME' ? match.homeTeam : match.awayTeam)}</span> kazanır 
                            <span className="text-zinc-400"> ({prediction.predictedDifference} fark)</span>
                          </>
                        )}
                      </div>
                    </div>
                    {prediction.pointsAwarded !== null && (
                      <div className="text-right">
                        <div className="text-xs text-zinc-500">Kazanılan Puan</div>
                        <div className="text-lg font-bold text-yellow-400">+{prediction.pointsAwarded}</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    {!isLocked && !isSelected && (
                      <button
                        onClick={() => openEdit(prediction)}
                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                      >
                        Tahmini Düzenle
                      </button>
                    )}

                    {isLocked && match.status === 'SCHEDULED' && (
                      <div className="w-full py-3 bg-zinc-950 text-zinc-500 font-medium rounded-xl flex items-center justify-center gap-2 border border-zinc-800">
                        <Lock size={16} /> Değiştirilemez (Maç Kilitlendi)
                      </div>
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
                            onClick={() => handlePredict(match.id as number)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                          >
                            Güncelle
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
