import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#1e3a8a', '#6366f1'];

const AccueilTechnicien = () => {
  const [data, setData] = useState({
    stats: { overdue: 0, dueToday: 0, open: 0, total: 0 },
    charts: { priorityData: [], statusData: [], categoryData: [] }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        // ✅ Correct Port: 3001
        const response = await axios.get('http://localhost:3001/api/accueil/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // The backend now sends the correct 'type' and pre-formatted chart data
        if (response.data.type === 'technician') {
          setData({
            stats: response.data.stats,
            charts: response.data.charts // Directly use the backend format
          });
        }
      } catch (error) {
        console.error("Erreur de chargement du dashboard technicien:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="ml-3 font-semibold text-gray-600">Chargement...</span>
    </div>
  );

  const topStats = [
    { label: "En retard", value: data.stats.overdue, color: "border-t-red-500" },
    { label: "Mes Ouverts", value: data.stats.open, color: "border-t-blue-500" },
    { label: "Assignés (Total)", value: data.stats.total, color: "border-t-indigo-500" },
    { label: "Aujourd'hui", value: data.stats.dueToday, color: "border-t-purple-500" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 uppercase tracking-tight">
        Tableau de Bord Technicien <span className="text-sm font-normal text-gray-500">(Mes Activités)</span>
      </h1>

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {topStats.map((s, i) => (
          <div key={i} className={`bg-white p-5 rounded-lg shadow-sm border-t-4 ${s.color} transition-transform hover:scale-105`}>
            <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">{s.label}</p>
            <p className="text-3xl font-extrabold text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Priority Pie */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 mb-4 border-b pb-2 text-center uppercase">Priorité des tickets</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.charts.priorityData} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                  {data.charts.priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Horizontal Bar */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 mb-4 border-b pb-2 text-center uppercase">États d'avancement</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data.charts.statusData} margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{fontSize: 10}} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Vertical Bar */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 mb-4 border-b pb-2 text-center uppercase">Répartition par Catégorie</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10}} />
                <YAxis tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccueilTechnicien;