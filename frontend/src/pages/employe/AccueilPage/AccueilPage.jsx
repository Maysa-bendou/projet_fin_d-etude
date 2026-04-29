import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { MdHistory, MdCheckCircle, MdHourglassEmpty, MdAutorenew } from 'react-icons/md';
import { PRIORITY_CONFIG, STATUS_CONFIG } from "../../../config/styles";
import Pill from "../../../components/common/Pill";

const AccueilPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('employee');
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
    <div style={{ padding: 40, textAlign: 'center', color: '#faf9f7' }}>{t('common.loading')}</div>
  );

  const STATS = [
    { label: t('accueil.stats.total'),       val: stats.total,       Icon: MdHistory,        c: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
    { label: t('accueil.stats.open'),        val: stats.open,        Icon: MdHourglassEmpty, c: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
    { label: t('accueil.stats.in_progress'), val: stats.in_progress, Icon: MdAutorenew,      c: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
    { label: t('accueil.stats.resolved'),    val: stats.resolved,    Icon: MdCheckCircle,    c: "#10b981", bg: "#f0fdf4", border: "#a7f3d0" },
  ];

  return (
    <div style={{ padding: '15px', background: '#faf9f7', minHeight: '100vh' }}>

      <div style={{ marginBottom: 29 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{t('accueil.title')}</h1>
        <p style={{ fontSize: 14, color: "#53575c", margin: 0, fontWeight: 530 }}>{t('accueil.subtitle')}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        {STATS.map(({ label, val, Icon, c, bg, border }) => (
          <div key={label} style={{
            background: "#fff",
            border: `1.5px solid ${border}`,
            borderRadius: 16,
            padding: "18px 20px",
            boxShadow: `0 1px 3px #0001, inset 0 0 0 999px ${bg}30`,
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}>
            <div>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                {label}
              </p>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 800, color: c, lineHeight: 1 }}>{val}</p>
            </div>
            <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 10, padding: 8 }}>
              <Icon size={18} color={c} />
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #d9d4cc', padding: '24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>{t('accueil.recentTickets')}</h2>
          <button
            onClick={() => navigate('/employee/mes-tickets')}
            style={{ background: 'none', border: 'none', color: '#534ab7', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            {t('accueil.viewAll')} →
          </button>
        </div>

        <div style={{ borderRadius: 12, border: '1.5px solid #d9d4cc', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#faf9f7', borderBottom: '1.5px solid #d9d4cc' }}>
                {[
                  t('table.id'),
                  t('table.title'),
                  t('table.service'),
                  t('table.priority'),
                  t('table.status'),
                  t('table.createdAt'),
                  t('table.updatedAt'),
                ].map(col => (
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
                    {t('common.noTickets')}
                  </td>
                </tr>
              ) : (
                recentTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/employee/ticket/${ticket.id}`)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#faf9f7'}
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
                    <td style={{ padding: '13px 14px' }}><Pill config={STATUS_CONFIG}   value={ticket.status} /></td>
                    <td style={{ padding: '13px 14px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
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
