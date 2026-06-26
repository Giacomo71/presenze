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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SelectionPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          <p className="text-xl animate-pulse">Analisi consumi in corso...</p>
        </div>
      );
    }

    if (!data?.recommendation?.recommendedOffer) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-screen bg-transparent text-white">
          <p className="text-xl">Nessun dato disponibile. Carica le bollette su Google Drive prima di continuare.</p>
        </div>
      );
    }

    const { recommendation, consumptions } = data;
    const offer = recommendation.recommendedOffer;

    const chartData = {
      labels: consumptions.map((c: any) => `${c.month}/${c.year}`),
      datasets: [
        {
          label: 'Consumo kWh',
          data: consumptions.map((c: any) => c.consumptionKwh),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'top' as const, labels: { color: '#fff' } },
        title: { display: true, text: 'Storico Consumi (kWh)', color: '#fff' },
      },
      scales: {
        y: { ticks: { color: '#bbb' }, grid: { color: '#333' } },
        x: { ticks: { color: '#bbb' }, grid: { color: '#333' } },
      }
    };

    return (
      <main className="flex-1 min-w-0 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-blue-400">Analisi Consumi & Consigli</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-slate-700/50">
              <h2 className="text-xl font-semibold mb-4 text-white">Grafico Consumi</h2>
              <div className="w-full">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-800 to-blue-900 p-6 rounded-2xl shadow-xl flex flex-col justify-center border border-indigo-500/30">
              <h2 className="text-2xl font-semibold mb-2 text-white">Offerta Consigliata</h2>
              <p className="text-sm text-blue-200 mb-6">{recommendation.analysis}</p>
              
              <div className="bg-white/10 p-4 rounded-xl mb-4 backdrop-blur-sm border border-white/20 text-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Fornitore</span>
                  <span className="font-bold text-lg">{offer.provider}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Costo Fisso Mensile</span>
                  <span className="font-bold text-emerald-400">€{offer.fixedMonthlyFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Prezzo al kWh</span>
                  <span className="font-bold text-emerald-400">€{offer.pricePerKwh.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Durata Contratto</span>
                  <span className="font-bold">{offer.contractLengthMonths} mesi</span>
                </div>
              </div>

              <div className="text-center mt-4 text-white">
                <span className="text-gray-300 block mb-1">Costo Annuale Stimato</span>
                <span className="text-4xl font-extrabold text-emerald-400">€{recommendation.estimatedAnnualCost.toFixed(2)}</span>
              </div>
              
              <button className="mt-8 bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-blue-500/50">
                Attiva Offerta
              </button>
            </div>
          </div>
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

