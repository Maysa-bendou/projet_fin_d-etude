import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { MdReportProblem, MdAssignment, MdCheckCircle, MdToday } from 'react-icons/md';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6'];

// Composant StatCard identique à celui de l'employé
const StatCard = ({ title, value, IconComponent, bgColor, iconColor }) => (
  <div style={{
    background: '#fff',
    borderRadius: 16,
    border: '1.5px solid #d9d4cc',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  }}>
    <div style={{
      width: 48,
      height: 48,
      borderRadius: 14,
      background: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <IconComponent size={24} style={{ color: iconColor }} />
    </div>
    <div>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px 0', fontWeight: 700, textTransform: 'uppercase', tracking: '0.5px' }}>{title}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  </div>
);

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
        const response = await axios.get('http://localhost:3001/api/accueil/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.type === 'technician') {
          setData({
            stats: response.data.stats,
            charts: response.data.charts 
          });
        }
      } catch (error) {
        console.error("Erreur dashboard technicien:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#64748b', background: '#f9f6f2', minHeight: '100vh' }}>
      Chargement...
    </div>
  );

  return (
    <div style={{ padding: '32px', background: '#f9f6f2', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Header identique */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
          Tableau de Bord Technicien
        </h1>
        <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, margin: '4px 0 0 0' }}>MES ACTIVITÉS ET INTERVENTIONS</p>
      </div>

      {/* 1. Stats Cards avec les icônes Technicien */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        <StatCard title="En retard" value={data.stats.overdue} IconComponent={MdReportProblem} bgColor="#fef2f2" iconColor="#ef4444" />
        <StatCard title="Mes Ouverts" value={data.stats.open} IconComponent={MdAssignment} bgColor="#eff6ff" iconColor="#3b82f6" />
        <StatCard title="Total Assignés" value={data.stats.total} IconComponent={MdCheckCircle} bgColor="#f0fdf4" iconColor="#22c55e" />
        <StatCard title="À faire aujourd'hui" value={data.stats.dueToday} IconComponent={MdToday} bgColor="#fffbeb" iconColor="#f59e0b" />
      </div>

      {/* 2. Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        
        {/* Priorité */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #d9d4cc', padding: '24px' }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 24, textAlign: 'center', textTransform: 'uppercase' }}>
            Priorité des tickets
          </h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.charts.priorityData} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                  {data.charts.priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1.5px solid #d9d4cc' }} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 20 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* États d'avancement */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #d9d4cc', padding: '24px' }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 24, textAlign: 'center', textTransform: 'uppercase' }}>
            États d'avancement
          </h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data.charts.statusData} margin={{ left: 0, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} width={80} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f9f6f2'}} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Catégories */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #d9d4cc', padding: '24px' }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 24, textAlign: 'center', textTransform: 'uppercase' }}>
            Répartition par Catégorie
          </h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f9f6f2'}} />
                <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccueilTechnicien;