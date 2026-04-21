import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdSearch, MdHistory, MdCheckCircle, MdErrorOutline, MdHourglassEmpty } from 'react-icons/md';

const StatCard = ({ title, value, IconComponent, bgColor, iconColor }) => (
  <div style={{
    background: '#fff',
    borderRadius: 14,
    border: '1.5px solid #d9d4cc', // Bordure beige de ton modèle
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  }}>
    <div style={{
      width: 46,
      height: 46,
      borderRadius: 12,
      background: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <IconComponent size={21} style={{ color: iconColor }} />
    </div>
    <div>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 3px 0', fontWeight: 400 }}>{title}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  </div>
);

const getPriorityBadge = (priority) => {
  const map = {
    high: { bg: '#fef2f2', color: '#dc2626', label: 'Haute', border: '#fecaca' },
    medium: { bg: '#fefce8', color: '#ca8a04', label: 'Moyenne', border: '#e6ce77' },
    low: { bg: '#f0fdf4', color: '#16a34a', label: 'Basse', border: '#bbf7d0' },
  };
  const key = (priority || '').toLowerCase();
  const s = map[key] || { bg: '#f1f5f9', color: '#64748b', label: priority || '-', border: '#e2e8f0' };
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 20, padding: '2px 10px',
      fontSize: 12, fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
};

const AccueilPage = () => {
  const [stats, setStats] = useState({ total: 0, resolved: 0, open: 0, rejected: 0 });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEmployeeDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/accueil/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.type === 'employee') {
          setStats(response.data.stats);
          setTickets(response.data.tickets);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeDashboard();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const filteredTickets = tickets.filter(t =>
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Chargement...</div>;

  return (
    <div style={{ padding: '32px', background: '#f9f6f2', minHeight: '100vh' }}> {/* Fond crème */}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Mon Espace Support
        </h1>
      </div>

      {/* Stats avec ta structure d'origine */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        <StatCard title="Total Créés" value={stats.total} IconComponent={MdHistory} bgColor="#eff6ff" iconColor="#3b82f6" />
        <StatCard title="Résolus" value={stats.resolved} IconComponent={MdCheckCircle} bgColor="#f0fdf4" iconColor="#22c55e" />
        <StatCard title="Ouverts" value={stats.open} IconComponent={MdHourglassEmpty} bgColor="#fffbeb" iconColor="#f59e0b" />
        <StatCard title="Rejetés" value={stats.rejected} IconComponent={MdErrorOutline} bgColor="#fef2f2" iconColor="#ef4444" />
      </div>

      {/* Carte principale */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #d9d4cc', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Mes Demandes de Support
          </h2>
          <div style={{ position: 'relative', width: 260 }}>
            <MdSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Rechercher un ticket..."
              style={{
                border: '1.5px solid #d9d4cc', borderRadius: 8, padding: '7px 12px 7px 32px',
                fontSize: 13, outline: 'none', width: '100%', background: '#f9f6f2', boxSizing: 'border-box',
              }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tableau avec ta structure d'origine */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #d9d4cc', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#fcfaf8', borderBottom: '1.5px solid #d9d4cc' }}>
                {['Titre', 'Catégorie', 'Priorité', 'Créé le', 'Solution'].map(col => (
                  <th key={col} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#1e293b', fontWeight: 500 }}>{ticket.title}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>{ticket.category}</td>
                  <td style={{ padding: '14px 16px' }}>{getPriorityBadge(ticket.priority)}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>{formatDate(ticket.createdAt || ticket.created_at)}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
                    {ticket.solution || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>En attente</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccueilPage;