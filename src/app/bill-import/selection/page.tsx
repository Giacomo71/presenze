'use client';
import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Sidebar } from "@/components/dashboard/sidebar";
import { Zap, Flame, Wallet, ArrowRight, TrendingUp } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SelectionPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'electricity' | 'gas' | 'total'>('electricity');

  useEffect(() => {
    fetch('/api/sync-bills').then(() => {
      fetch('/api/recommendation')
        .then((res) => res.json())
        .then((json) => {
          setData(json);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    });
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-screen bg-transparent text-white">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-blue-500 border-b-indigo-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl animate-pulse text-slate-300">Analisi e comparazione consumi in corso...</p>
          </div>
        </div>
      );
    }

    if (!data?.recommendation || (!data.recommendation.electricity?.recommendedOffer && !data.recommendation.gas?.recommendedOffer)) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-screen bg-transparent text-white">
          <div className="text-center max-w-md p-6 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50">
            <p className="text-xl mb-4 font-semibold text-slate-300">Nessun dato disponibile</p>
            <p className="text-slate-400 text-sm">Carica le tue bollette contenenti le parole "luce" o "gas" in Google Drive e avvia la sincronizzazione.</p>
          </div>
        </div>
      );
    }

    const { recommendation, consumptions = [] } = data;

    // Filter consumptions
    const electricityConsumptions = consumptions.filter((c: any) => c.utility === 'electricity');
    const gasConsumptions = consumptions.filter((c: any) => c.utility === 'gas');

    // Chart configs
    const getChartData = () => {
      if (activeTab === 'electricity') {
        return {
          labels: electricityConsumptions.map((c: any) => `${c.month}/${c.year}`),
          datasets: [
            {
              label: 'Consumo Luce (kWh)',
              data: electricityConsumptions.map((c: any) => c.consumption),
              backgroundColor: 'rgba(245, 158, 11, 0.7)', // Amber
              borderColor: 'rgba(245, 158, 11, 1)',
              borderWidth: 1.5,
              borderRadius: 6,
            },
          ],
        };
      } else if (activeTab === 'gas') {
        return {
          labels: gasConsumptions.map((c: any) => `${c.month}/${c.year}`),
          datasets: [
            {
              label: 'Consumo Gas (smc)',
              data: gasConsumptions.map((c: any) => c.consumption),
              backgroundColor: 'rgba(6, 182, 212, 0.7)', // Cyan
              borderColor: 'rgba(6, 182, 212, 1)',
              borderWidth: 1.5,
              borderRadius: 6,
            },
          ],
        };
      } else {
        // Combined comparison
        const allMonths = Array.from(new Set(consumptions.map((c: any) => `${c.month}/${c.year}`)));
        return {
          labels: allMonths,
          datasets: [
            {
              label: 'Luce (kWh)',
              data: allMonths.map(m => {
                const found = electricityConsumptions.find((c: any) => `${c.month}/${c.year}` === m);
                return found ? found.consumption : 0;
              }),
              backgroundColor: 'rgba(245, 158, 11, 0.5)',
              borderColor: 'rgba(245, 158, 11, 1)',
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Gas (smc)',
              data: allMonths.map(m => {
                const found = gasConsumptions.find((c: any) => `${c.month}/${c.year}` === m);
                return found ? found.consumption : 0;
              }),
              backgroundColor: 'rgba(6, 182, 212, 0.5)',
              borderColor: 'rgba(6, 182, 212, 1)',
              borderWidth: 1,
              borderRadius: 4,
            }
          ]
        };
      }
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const, labels: { color: '#e2e8f0', font: { family: 'Outfit, sans-serif' } } },
      },
      scales: {
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51, 65, 85, 0.5)' } },
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51, 65, 85, 0.5)' } },
      }
    };

    const activeRec = activeTab === 'electricity' ? recommendation.electricity : recommendation.gas;

    return (
      <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Analisi Bollette & Risparmio</h1>
              <p className="text-slate-400 text-sm mt-1">Confronta i tuoi consumi reali ed individua la migliore tariffa di mercato.</p>
            </div>
            
            {/* Quick summary card */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-2 flex items-center gap-3">
              <Wallet className="h-5 w-5 text-emerald-400" />
              <div>
                <span className="text-xs text-slate-400 block">Stima Costo Annuo Totale</span>
                <span className="text-lg font-bold text-emerald-400">€{recommendation.estimatedAnnualCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-800/40 p-1.5 rounded-xl border border-slate-700/40 max-w-md">
            <button
              onClick={() => setActiveTab('electricity')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'electricity'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Zap className="h-4 w-4" />
              Luce
            </button>
            <button
              onClick={() => setActiveTab('gas')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'gas'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Flame className="h-4 w-4" />
              Gas
            </button>
            <button
              onClick={() => setActiveTab('total')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'total'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Riepilogo
            </button>
          </div>

          {/* Core Panel layout */}
          {activeTab !== 'total' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart container */}
              <div className="lg:col-span-2 bg-slate-800/30 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 flex flex-col h-[350px] lg:h-[400px]">
                <h2 className="text-lg font-bold text-white mb-4">Storico dei Consumi</h2>
                <div className="flex-1 relative min-h-0">
                  <Bar data={getChartData()} options={chartOptions} />
                </div>
              </div>

              {/* Recommended Offer Card */}
              <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                activeTab === 'electricity'
                  ? 'bg-gradient-to-br from-amber-950/20 to-slate-900 border-amber-500/20'
                  : 'bg-gradient-to-br from-cyan-950/20 to-slate-900 border-cyan-500/20'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`p-2 rounded-lg ${
                      activeTab === 'electricity' ? 'bg-amber-500/10 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {activeTab === 'electricity' ? <Zap className="h-5 w-5" /> : <Flame className="h-5 w-5" />}
                    </span>
                    <h2 className="text-xl font-bold text-white">Offerta Raccomandata</h2>
                  </div>

                  <p className="text-sm text-slate-300 mb-6">{activeRec.analysis}</p>

                  {activeRec.recommendedOffer ? (
                    <div className="bg-slate-900/60 border border-slate-800/50 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Fornitore</span>
                        <span className="font-bold text-sm text-white">{activeRec.recommendedOffer.provider}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Quota Fissa Mensile</span>
                        <span className="font-bold text-sm text-emerald-400">€{activeRec.recommendedOffer.fixedMonthlyFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Costo Energia / Unit</span>
                        <span className="font-bold text-sm text-emerald-400">
                          €{activeRec.recommendedOffer.pricePerUnit.toFixed(4)} /{activeTab === 'electricity' ? 'kWh' : 'smc'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Validità Tariffa</span>
                        <span className="font-bold text-sm text-white">{activeRec.recommendedOffer.contractLengthMonths} mesi</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">Nessuna offerta caricata o applicabile.</p>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Costo Annuo Stimato Utenza</span>
                  <span className={`text-4xl font-extrabold ${activeTab === 'electricity' ? 'text-amber-400' : 'text-cyan-400'}`}>
                    €{activeRec.estimatedAnnualCost.toFixed(2)}
                  </span>
                  
                  <button className={`mt-6 w-full font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                    activeTab === 'electricity' 
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-amber-500/10' 
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-cyan-500/10'
                  }`}>
                    Attiva Offerta
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Combined / Total View */
            <div className="space-y-8">
              {/* Dual-axis or comparison chart */}
              <div className="bg-slate-800/30 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 flex flex-col h-[350px]">
                <h2 className="text-lg font-bold text-white mb-4">Confronto Volumi Luce & Gas</h2>
                <div className="flex-1 relative min-h-0">
                  <Bar data={getChartData()} options={chartOptions} />
                </div>
              </div>

              {/* Combined offers summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Electricity summary */}
                <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-amber-400" />
                      <h3 className="font-bold text-lg text-white">Servizio Elettrico (Luce)</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">{recommendation.electricity.analysis}</p>
                    {recommendation.electricity.recommendedOffer && (
                      <div className="text-xs text-slate-300 space-y-1">
                        <div>Consigliato: <strong className="text-white">{recommendation.electricity.recommendedOffer.provider}</strong></div>
                        <div>Costo annuo stimato: <strong className="text-emerald-400">€{recommendation.electricity.estimatedAnnualCost.toFixed(2)}</strong></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gas summary */}
                <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Flame className="h-5 w-5 text-cyan-400" />
                      <h3 className="font-bold text-lg text-white">Servizio Gas Riscaldamento</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">{recommendation.gas.analysis}</p>
                    {recommendation.gas.recommendedOffer && (
                      <div className="text-xs text-slate-300 space-y-1">
                        <div>Consigliato: <strong className="text-white">{recommendation.gas.recommendedOffer.provider}</strong></div>
                        <div>Costo annuo stimato: <strong className="text-emerald-400">€{recommendation.gas.estimatedAnnualCost.toFixed(2)}</strong></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    );
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      {renderContent()}
    </div>
  );
}

