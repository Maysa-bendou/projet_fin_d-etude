import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  MdAccessTime, 
  MdCheckCircleOutline, 
  MdBarChart, 
  MdAssignment, 
  MdErrorOutline 
} from 'react-icons/md';

export default function StatistiqueGlobal() {
  // ─────────────────────────────
  // 1. STATES
  // ─────────────────────────────
  const [servicesData, setServicesData] = useState([]);
  const [totalTicketsAll, setTotalTicketsAll] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─────────────────────────────
  // 2. FETCH DATA (UPDATED API)
  // ─────────────────────────────
  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          'http://localhost:3001/api/services/global-stats'
        );

        setServicesData(response.data.services || []);
        setTotalTicketsAll(response.data.totalGlobal || 0);

        setError(null);
      } catch (err) {
        console.error("Erreur stats globales:", err);
        setError("Impossible de charger les statistiques.");
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalStats();
  }, []);

  // ─────────────────────────────
  // 3. GLOBAL CALCULATIONS
  // ─────────────────────────────
  const globalResRate = servicesData.length > 0 
    ? Math.round(
        servicesData.reduce((acc, s) => acc + (s.resolutionRate || 0), 0) 
        / servicesData.length
      )
    : 0;

  const globalAvgTime = servicesData.length > 0 
    ? (
        servicesData.reduce((acc, s) => acc + parseFloat(s.avgTime || 0), 0) 
        / servicesData.length
      ).toFixed(1)
    : "0.0";

  // ─────────────────────────────
  // 4. LOADING STATE
  // ─────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600 font-medium">
        Chargement des données...
      </span>
    </div>
  );

  // ─────────────────────────────
  // 5. ERROR STATE
  // ─────────────────────────────
  if (error) return (
    <div className="p-10 text-center text-red-500 flex flex-col items-center">
      <MdErrorOutline size={48} />
      <p className="mt-2 font-bold">{error}</p>
    </div>
  );

  // ─────────────────────────────
  // 6. UI
  // ─────────────────────────────
  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MdBarChart className="text-blue-600" /> Dashboard Analytics
        </h1>

        <div className="flex items-center gap-2 bg-white shadow-sm border border-blue-100 px-5 py-2 rounded-2xl">
          <span className="text-gray-500 text-sm font-medium">
            Volume Total :
          </span>
          <span className="text-blue-700 text-xl font-black">
            {totalTicketsAll} Tickets
          </span>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Resolution Rate */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all">
          <MdCheckCircleOutline className="mx-auto text-green-500 text-5xl mb-4" />
          <h2 className="text-xl font-bold text-gray-800">
            Taux de Résolution
          </h2>
          <p className="text-gray-500 mb-6 text-sm italic">
            Moyenne de performance inter-services
          </p>

          <div className="text-5xl font-black text-green-600 mb-2">
            {globalResRate}%
          </div>

          <div className="w-full bg-gray-100 h-2 rounded-full mt-4 max-w-xs mx-auto">
            <div 
              className="bg-green-500 h-full rounded-full transition-all duration-1000" 
              style={{ width: `${globalResRate}%` }}
            ></div>
          </div>
        </div>

        {/* Avg Time */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all">
          <MdAccessTime className="mx-auto text-blue-500 text-5xl mb-4" />
          <h2 className="text-xl font-bold text-gray-800">
            Délai Moyen (MTTR)
          </h2>
          <p className="text-gray-500 mb-6 text-sm italic">
            Temps moyen jusqu'à résolution
          </p>

          <div className="text-5xl font-black text-blue-600 mb-2">
            {globalAvgTime}h
          </div>

          <p className="text-xs text-gray-400">
            Calculé sur les tickets clôturés
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-2">
          <MdAssignment className="text-gray-400 text-xl" />
          <h2 className="text-lg font-bold text-gray-700">
            Répartition par Service
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Nom du Service</th>
                <th className="px-6 py-4 text-center">Tickets Liés</th>
                <th className="px-6 py-4 text-center">Efficacité</th>
                <th className="px-6 py-4 text-center">Temps de Traitement</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {servicesData.map((service) => (
                <tr 
                  key={service.id} 
                  className="hover:bg-blue-50/40 transition-colors group"
                >
                  <td className="px-6 py-4 font-semibold text-gray-800 group-hover:text-blue-700">
                    {service.name}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="bg-gray-100 text-gray-700 px-4 py-1 rounded-xl text-sm font-bold">
                      {service.totalTickets}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-green-600 font-bold">
                        {service.resolutionRate}%
                      </span>

                      <div className="w-20 bg-gray-100 h-1 rounded-full">
                        <div 
                          className="bg-green-500 h-full rounded-full" 
                          style={{ width: `${service.resolutionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center font-mono text-blue-600 font-medium">
                    {service.avgTime}h
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}