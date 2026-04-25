import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MdHistory, MdCheckCircle, MdHourglassEmpty, MdAutorenew } from 'react-icons/md';
import { PRIORITY_CONFIG, STATUS_CONFIG } from "../../../config/styles";
import Pill from "../../../components/common/Pill";
const StatCard = ({ title, value, IconComponent, bgColor, iconColor }) => (
  <div style={{
    background: '#fff', borderRadius: 14, border: '1.5px solid #d9d4cc',
    padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
  }}>
    <div style={{
      width: 46, height: 46, borderRadius: 12, background: bgColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <IconComponent size={21} style={{ color: iconColor }} />
    </div>
    <div>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 3px 0', fontWeight: 400 }}>{title}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  </div>
);




const AccueilPage = () => {
  const navigate = useNavigate();
  const [stats, setStats]     = useState({ total: 0, resolved: 0, open: 0, in_progress: 0 });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3001/api/accueil/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.type === 'employee') {
          setStats(res.data.stats);
          setTickets(res.data.tickets);
        }
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const fmtDate = (str) => {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";

  const day   = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("fr-FR", { month: "short" });
  const year  = d.getFullYear();

  return `${day} ${month} ${year}`;
};

  // 5 most recent, closed excluded
  const recentTickets = tickets
    .filter(t => t.status !== 'closed')
    .sort((a, b) =>
      new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
    )
    .slice(0, 5);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Chargement...</div>
  );

  return (
    <div style={{ padding: '25px', background: '#f9f6f2', minHeight: '100vh' }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Mon Espace Support</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        
        <StatCard title="Total Créés" value={stats.total}       IconComponent={MdHistory}        bgColor="#eff6ff" iconColor="#3b82f6" />
        <StatCard title="Ouverts"     value={stats.open}        IconComponent={MdHourglassEmpty} bgColor="#fff7ed" iconColor="#ea580c" />
        <StatCard title="En cours"    value={stats.in_progress} IconComponent={MdAutorenew}      bgColor="#faeeda" iconColor="#f59e0b" />
        <StatCard title="Résolus"     value={stats.resolved}    IconComponent={MdCheckCircle}    bgColor="#f0fdf4" iconColor="#22c55e" />
        </div>

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #d9d4cc', padding: '24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>Mes Tickets Récents</h2>
          <button
            onClick={() => navigate('/employee/mes-tickets')}
            style={{ background: 'none', border: 'none', color: '#534ab7', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Voir tous mes tickets →
          </button>
        </div>

        <div style={{ borderRadius: 12, border: '1.5px solid #d9d4cc', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#fcfaf8', borderBottom: '1.5px solid #d9d4cc' }}>
                {['#', 'Titre', 'Service', 'Priorité', 'Statut', 'Créé le', 'Mise à jour'].map(col => (
                  <th key={col} style={{
                    padding: '10px 14px', fontSize: 11, fontWeight: 700,
                    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    Aucun ticket trouvé.
                  </td>
                </tr>
              ) : (
                recentTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/employee/ticket/${ticket.id}`)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9f6f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 14px', fontSize: 12, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      #{ticket.id}
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: 13, color: '#1e293b', fontWeight: 500, maxWidth: 220 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.title}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {ticket.services?.name ?? '—'}
                    </td>
                   <td style={{ padding: '13px 14px' }}><Pill config={PRIORITY_CONFIG} value={ticket.priority} /></td>
<td style={{ padding: '13px 14px' }}><Pill config={STATUS_CONFIG}   value={ticket.status} /></td> <td style={{ padding: '13px 14px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {fmtDate(ticket.created_at)}

                    </td>
                    <td style={{ padding: '13px 14px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {fmtDate(ticket.updated_at || ticket.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccueilPage;