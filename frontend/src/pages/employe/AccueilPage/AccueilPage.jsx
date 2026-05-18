import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { MdHistory, MdCheckCircle, MdHourglassEmpty, MdAutorenew } from 'react-icons/md';
import { PRIORITY_CONFIG, STATUS_CONFIG } from "../../../config/styles";
import Pill from "../../../components/common/Pill";
import { formatDate, translateKey, STATUS_KEYS, PRIORITY_KEYS } from "../../../constants/ticketKeys";

const AccueilPage = () => {
  const navigate = useNavigate();
  // ── FIX 1: load both namespaces so employee.* and common.* both resolve ──
  const { t, i18n } = useTranslation(["employee", "common"]);
  const currentLang = i18n.language; // triggers re-render on language switch

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

  // ── FIX 2: use shared formatDate from ticketKeys (language-aware, uses common.json date.locale) ──
  const fmtDate = (str) => formatDate(t, str, "long");

  // 5 most recent, closed excluded — logic untouched
  const recentTickets = tickets
    .filter(tk => tk.status !== 'closed')
    .sort((a, b) =>
      new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
    )
    .slice(0, 5);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#faf9f7' }}>{t('common.loading')}</div>
  );

const STATS = [
  { label: t('accueil.stats.total'),       val: stats.total,       Icon: MdHistory,        c: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  { label: t('accueil.stats.open'),        val: stats.open,        Icon: MdHourglassEmpty, c: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  { label: t('accueil.stats.in_progress'), val: stats.in_progress, Icon: MdAutorenew,      c: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { label: t('accueil.stats.resolved'),    val: stats.resolved,    Icon: MdCheckCircle,    c: "#15803d", bg: "#f0fdf4", border: "#a7f3d0" },
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
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e2d9', overflow: 'hidden' }}>

        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e8e2d9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{t('accueil.recentTickets')}</h2>
          <button
            onClick={() => navigate('/employee/mes-tickets')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            <MdHistory size={14} />
            {t('accueil.viewAll')}
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 55 }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 110 }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#faf9f7', borderBottom: '1.5px solid #e8e2d9' }}>
                {[
                  t('table.id'), t('table.title'), t('table.service'),
                  t('table.priority'), t('table.status'),
                  t('table.createdAt'), t('table.updatedAt'),
                ].map(col => (
                  <th key={col} style={{ padding: '9px 10px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>{t('common.noTickets')}</p>
                  </td>
                </tr>
              ) : (
                recentTickets.map((ticket, idx) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/employee/ticket/${ticket.id}`)}
                    style={{ background: '#fff', borderBottom: idx === recentTickets.length - 1 ? 'none' : '1px solid #f4f0ec', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#faf8f5'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <td style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, color: '#c4bfb8' }}>#{ticket.id}</td>
                    <td style={{ padding: '9px 10px', fontSize: 12, color: '#1e293b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.title}
                    </td>
                    <td style={{ padding: '9px 10px', fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.service?.name ?? '—'}
                    </td>
                    {/* ── FIX 3: Pill now receives translated label for priority ── */}
                    <td style={{ padding: '9px 10px' }}>
                      <Pill
                        config={PRIORITY_CONFIG}
                        value={ticket.priority}
                        label={translateKey(t, PRIORITY_KEYS, ticket.priority)}
                      />
                    </td>
                    {/* ── FIX 4: Pill now receives translated label for status ── */}
                    <td style={{ padding: '9px 10px' }}>
                      <Pill
                        config={STATUS_CONFIG}
                        value={ticket.status}
                        label={translateKey(t, STATUS_KEYS, ticket.status)}
                      />
                    </td>
                    <td style={{ padding: '9px 10px', fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {fmtDate(ticket.created_at)}
                    </td>
                    <td style={{ padding: '9px 10px', fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
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
