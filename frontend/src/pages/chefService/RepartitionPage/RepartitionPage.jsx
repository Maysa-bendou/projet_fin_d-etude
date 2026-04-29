import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ReferenceLine, LabelList
} from 'recharts';
import {
  MdFileDownload, MdPeople, MdFilterList, MdArrowBack,
  MdAssignment, MdCheckCircle, MdTimer, MdTrendingUp
} from 'react-icons/md';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';

// ── Color map ──────────────────────────────────────────────────────────────────
const getDynamicColor = (name, index) => {
  const map = {
    'open': '#3b82f6', 'in_progress': '#8b5cf6', 'resolved': '#10b981',
    'closed': '#06b6d4', 'rejected': '#ef4444', 'pending': '#f59e0b',
    'pending_supplier': '#0284c7', 'critical': '#ef4444', 'high': '#f97316',
    'medium': '#f59e0b', 'low': '#10b981', 'incident': '#e11d48', 'demande': '#0ea5e9',
    'problem': '#7c3aed', 'problème': '#7c3aed'
  };
  const palette = ['#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#f97316'];
  return map[name?.toLowerCase()] || palette[index % palette.length];
};

// ── Custom chart sub-components ───────────────────────────────────────────────
const BarTopLabel = ({ x, y, width, value }) => {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 5} fill="#64748b" fontSize={11} fontWeight={600} textAnchor="middle">
      {value}
    </text>
  );
};

const AreaDot = ({ cx, cy, value }) => {
  if (!value) return null;
  return <circle cx={cx} cy={cy} r={4} fill="#6366f1" stroke="#fff" strokeWidth={2} />;
};

const AreaValueLabel = ({ x, y, value }) => {
  if (!value) return null;
  return <text x={x} y={y - 10} fill="#6366f1" fontSize={10} fontWeight={700} textAnchor="middle">{value}</text>;
};

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="central">
      {value}
    </text>
  );
};

// ── Shared sub-components ─────────────────────────────────────────────────────
function Indicator({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#475569', fontWeight: 500, whiteSpace: 'nowrap' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </span>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0', borderLeft: `4px solid ${color}` }}>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RepartitionPage() {
  const { t, i18n } = useTranslation('chef');

  // Month list built from translation keys so it reacts to language switches
  const MONTHS = useMemo(() => [
    { value: 1,  label: t('months.jan') }, { value: 2,  label: t('months.feb') },
    { value: 3,  label: t('months.mar') }, { value: 4,  label: t('months.apr') },
    { value: 5,  label: t('months.may') }, { value: 6,  label: t('months.jun') },
    { value: 7,  label: t('months.jul') }, { value: 8,  label: t('months.aug') },
    { value: 9,  label: t('months.sep') }, { value: 10, label: t('months.oct') },
    { value: 11, label: t('months.nov') }, { value: 12, label: t('months.dec') },
  ], [i18n.language]);

  const MONTH_ORDER = MONTHS.map(m => m.label);

  const [services, setServices]                   = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [stats, setStats]                         = useState(null);
  const [loadingServices, setLoadingServices]     = useState(true);
  const [loadingStats, setLoadingStats]           = useState(false);

  const [selectedYear, setSelectedYear]   = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // ── Fetch service list ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/services');
        const data = res.data;
        const raw = Array.isArray(data) ? data : (data.services || []);
        setServices(raw.filter(s => s.id !== 0));
      } catch (err) {
        console.error("Erreur services:", err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // ── Fetch stats for the selected service ─────────────────────────────────
  const fetchStats = useCallback(async (serviceId, year, month) => {
    if (!serviceId) return;
    setLoadingStats(true);
    try {
      const params = {};
      if (year)  params.year  = year;
      if (month) params.month = month;
      const res = await axios.get(
        `http://localhost:3001/api/chef/stats/service/${serviceId}`,
        { params }
      );
      setStats(res.data);
    } catch (err) {
      console.error("Erreur stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(selectedServiceId, selectedYear, selectedMonth);
  }, [selectedServiceId, selectedYear, selectedMonth, fetchStats]);

  // ── Filter handlers ───────────────────────────────────────────────────────
  const handleYearChange  = (e) => { setSelectedYear(e.target.value); if (!e.target.value) setSelectedMonth(''); };
  const handleMonthChange = (e) => setSelectedMonth(e.target.value);
  const clearFilters      = () => { setSelectedYear(''); setSelectedMonth(''); };

  const handleSelectService = (id) => {
    setSelectedServiceId(id);
    setStats(null);
    setSelectedYear('');
    setSelectedMonth('');
  };

  const handleBack = () => {
    setSelectedServiceId(null);
    setStats(null);
    setSelectedYear('');
    setSelectedMonth('');
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const sortedMonthlyStats = useMemo(() => {
    if (!stats?.monthlyStats) return [];
    if (selectedMonth) return stats.monthlyStats;
    return [...stats.monthlyStats].sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month));
  }, [stats, selectedMonth, MONTH_ORDER]);

  const filterLabel = useMemo(() => {
    if (!selectedYear && !selectedMonth) return t('filter.allPeriods');
    if (selectedYear && selectedMonth) {
      const mLabel = MONTHS.find(m => m.value === parseInt(selectedMonth))?.label;
      return `${mLabel} ${selectedYear}`;
    }
    if (selectedYear) return `${t('filter.year')} ${selectedYear}`;
    return '';
  }, [selectedYear, selectedMonth, t, MONTHS]);

  // ── Export PDF ────────────────────────────────────────────────────────────
  const exportPDF = () => {
    if (!stats) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(20);
    doc.text(`${t('pdf.reportTitle')} : ${stats.serviceName}`, 40, 50);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${t('pdf.period')} : ${filterLabel}`, 40, 72);
    autoTable(doc, {
      startY: 90,
      head: [[t('pdf.indicator'), t('pdf.value')]],
      body: [
        [t('pdf.totalTickets'),     stats.totalTickets],
        [t('pdf.resolutionRate'),   `${stats.resolutionRate}%`],
        [t('pdf.slaIn'),            stats.slaStats?.[0]?.value ?? 0],
        [t('pdf.slaOut'),           stats.slaStats?.[1]?.value ?? 0],
      ],
      theme: 'striped'
    });
    if (stats.techPerformance?.length) {
      doc.text(t('pdf.techPerf'), 40, doc.lastAutoTable.finalY + 30);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 40,
        head: [[t('table.technician'), t('table.assigned'), t('table.resolved'), t('table.rejected'), t('table.resolutionRate')]],
        body: stats.techPerformance.map(tech => [tech.name, tech.totalAssigned, tech.resolu, tech.rejete, `${tech.resolutionRate}%`]),
        headStyles: { fillColor: [99, 102, 241] }
      });
    }
    doc.save(`${t('pdf.reportFile')}_${stats.serviceName}_${filterLabel.replace(/\s/g, '_')}.pdf`);
  };

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!stats) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { [t('pdf.indicator')]: t('pdf.totalTickets'),   [t('pdf.value')]: stats.totalTickets },
      { [t('pdf.indicator')]: t('pdf.resolutionRate'), [t('pdf.value')]: `${stats.resolutionRate}%` },
      { [t('pdf.indicator')]: t('pdf.slaConform'),     [t('pdf.value')]: stats.slaStats?.[0]?.value ?? 0 },
      { [t('pdf.indicator')]: t('pdf.slaExceeded'),    [t('pdf.value')]: stats.slaStats?.[1]?.value ?? 0 },
      { [t('pdf.indicator')]: t('pdf.period'),         [t('pdf.value')]: filterLabel },
    ]), "KPIs");
    if (stats.statusStats?.length)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.statusStats), t('excel.statuses'));
    if (stats.techPerformance?.length)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        stats.techPerformance.map(tech => ({
          [t('table.technician')]:     tech.name,
          [t('table.assigned')]:       tech.totalAssigned,
          [t('table.resolved')]:       tech.resolu,
          [t('table.rejected')]:       tech.rejete,
          [t('table.resolutionRate')]: `${tech.resolutionRate}%`
        }))
      ), t('excel.technicians'));
    if (stats.priorityStats?.length)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.priorityStats), t('excel.priorities'));
    if (sortedMonthlyStats.length)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sortedMonthlyStats), t('excel.trends'));
    XLSX.writeFile(wb, `${t('excel.statsFile')}_${stats.serviceName}_${filterLabel.replace(/\s/g, '_')}.xlsx`);
  };

  // ── Global styles ─────────────────────────────────────────────────────────
  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    .pp-card { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px 22px; }
    .pp-section-title { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin: 24px 0 10px; }
    .pp-chart-title { font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 16px; }
    .pp-filter-select { border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 12px; font-size: 13px; color: #334155; background: #fff; cursor: pointer; outline: none; font-family: inherit; transition: border-color 0.2s; }
    .pp-filter-select:focus { border-color: #6366f1; }
    .pp-filter-select:disabled { opacity: 0.45; cursor: not-allowed; }
    .pp-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; transition: opacity 0.15s; }
    .pp-btn:hover { opacity: 0.82; }
    .pp-clear-btn { border: 1px solid #fecdd3; border-radius: 8px; padding: 7px 13px; font-size: 12px; color: #e11d48; background: transparent; cursor: pointer; font-weight: 600; font-family: inherit; }
    .pp-clear-btn:hover { background: #fff1f2; }
    .service-card { background: #fff; border: 1px solid #e5e7eb; border-left: 4px solid #6366f1; border-radius: 14px; padding: 20px 24px; cursor: pointer; transition: box-shadow 0.2s, transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .service-card:hover { box-shadow: 0 8px 24px rgba(99,102,241,0.14); transform: translateY(-2px); }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  // ── RENDER: Loading services ──────────────────────────────────────────────
  if (loadingServices) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', color: '#64748b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ width: 44, height: 44, border: '3px solid #6366f1', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontWeight: 600 }}>{t('loading.services')}</p>
      </div>
    </div>
  );

  // ── VIEW 1: SERVICE SELECTION GRID ────────────────────────────────────────
  if (!selectedServiceId) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: "sans-serif" }}>
  <style>{globalStyles}</style>
  <div style={{ borderBottom: '1px solid #e8e2d9', padding: '14px 28px' }}>
    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
      {t('repartition.title')}
    </h1>
    <p style={{ fontSize: 14, color: '#53575c', margin: 0, fontWeight: 530 }}>
      {t('repartition.subtitle')}
    </p>
  </div>
  <div style={{ padding: '20px 28px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      {services.map((s) => (
        <div key={s.id} className="service-card" onClick={() => handleSelectService(s.id)}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 10px 0' }}>{s.name}</h3>
          {s.totalTickets !== undefined && (
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px', fontWeight: 500 }}>
              {s.totalTickets} {t('repartition.tickets')} · {s.resolutionRate ?? 0}% {t('repartition.resolved')}
            </p>
          )}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('repartition.analyze')} →
          </p>
        </div>
      ))}
    </div>   {/* closes grid */}
  </div>     
</div>       
    
    );
  }

  // ── LOADING STATS ─────────────────────────────────────────────────────────
  if (loadingStats && !stats) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', color: '#64748b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ width: 44, height: 44, border: '3px solid #6366f1', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontWeight: 600 }}>{t('loading.dashboard')}</p>
      </div>
    </div>
  );

  if (!stats) return null;

  // ── Derived values for VIEW 2 ─────────────────────────────────────────────
  const slaIn  = stats.slaStats?.[0]?.value ?? 0;
  const slaOut = stats.slaStats?.[1]?.value ?? 0;
  const resolvedCount  = stats.resolvedCount  ?? 0;
  const resolutionRate = stats.resolutionRate ?? 0;

  const techTableData = (stats.techPerformance || []).map(tech => ({
    ...tech,
    tauxParService: stats.totalTickets > 0 ? Math.round((tech.totalAssigned / stats.totalTickets) * 100) : 0,
  }));

  // ── VIEW 2: FULL STATS DASHBOARD ─────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: "sans-serif" }}>
  <style>{globalStyles}</style>

  {/* ── Header ── */}
  <div style={{ borderBottom: '1px solid #e8e2d9', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <button
        onClick={handleBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          cursor: 'pointer', color: '#94a3b8', fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, padding: 0,
          fontFamily: 'inherit'
        }}
      >
        <MdArrowBack style={{ fontSize: 14 }} /> {t('repartition.backToServices')}
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 0px' }}>
        {t('dashboard.title')}
      </h1>
      <p style={{ fontSize: 14, color: '#53575c', margin: 0, fontWeight: 530 }}>
        {stats.serviceName} · {t('dashboard.detailedView')}
      </p>
    </div>
    <div style={{ display: 'flex', gap: 10 }}>
      <button className="pp-btn" onClick={exportExcel} style={{ background: '#f0fdf4', color: '#15803d', border: '1.5px solid #bbf7d0' }}>
        <MdFileDownload size={17} /> {t('export.excel')}
      </button>
      <button className="pp-btn" onClick={exportPDF} style={{ background: '#0f172a', color: '#fff' }}>
        <MdFileDownload size={17} /> {t('export.pdf')}
      </button>
    </div>
  </div>
 <div style={{ padding: '20px 28px' }}>
      {/* ── Filter Bar ── */}
      <div className="pp-card" style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13, fontWeight: 700 }}>
          <MdFilterList size={18} color="#6366f1" />
          {t('filter.filterBy')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('filter.year')}</label>
          <select className="pp-filter-select" value={selectedYear} onChange={handleYearChange}>
            <option value="">{t('filter.all')}</option>
            {(stats.availableYears || []).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('filter.month')}</label>
          <select className="pp-filter-select" value={selectedMonth} onChange={handleMonthChange} disabled={!selectedYear}>
            <option value="">{t('filter.allMonths')}</option>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {(selectedYear || selectedMonth) && (
          <button className="pp-clear-btn" onClick={clearFilters} style={{ marginTop: 18 }}>✕ {t('filter.reset')}</button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>📅 {filterLabel}</span>
          {loadingStats && (
            <span style={{ width: 18, height: 18, border: '2.5px solid #6366f1', borderTop: '2.5px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard label={t('kpi.total')}         value={stats.totalTickets}   color="#6366f1" />
        <KpiCard label={t('kpi.resolutionRate')} value={`${resolutionRate}%`} color="#8b5cf6" />
        <KpiCard label={t('kpi.resolved')}      value={resolvedCount}         color="#0891b2" />
        <KpiCard label={t('kpi.slaIn')}         value={slaIn}                color="#10b981" />
        <KpiCard label={t('kpi.slaOut')}        value={slaOut}               color="#ef4444" />
      </div>

      {/* ── Section: Efficacité Équipe ── */}
      <p className="pp-section-title">{t('section.teamEfficiency')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>

        {/* Bar chart: Volume par Technicien */}
        <div className="pp-card">
          <p className="pp-chart-title">{t('chart.workloadByTech')}</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.techPerformance} barCategoryGap="30%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Bar dataKey="resolu" name={t('table.resolved')} fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={22}>
                <LabelList content={<BarTopLabel />} />
              </Bar>
              <Bar dataKey="rejete" name={t('table.rejected')} fill="#f43f5e" radius={[5, 5, 0, 0]} maxBarSize={22}>
                <LabelList content={<BarTopLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: 10 }}>
            <Indicator color="#10b981" label={t('table.resolved')} />
            <Indicator color="#f43f5e" label={t('table.rejected')} />
          </div>
        </div>

        {/* Technician Table */}
        <div className="pp-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MdPeople color="#6366f1" size={17} /> {t('chart.techDetail')}
            </p>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
              {t('chart.rateFormula')}
            </span>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 280 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                  {[t('table.technician'), t('table.assigned'), t('table.resolved'), t('table.resolutionRate')].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: h === t('table.technician') ? 'left' : 'center', color: '#64748b', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {techTableData.map((tech, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: '#1e293b' }}>{tech.name}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>{tech.totalAssigned}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      <span style={{ background: '#d1fae5', color: '#059669', borderRadius: 7, padding: '2px 10px', fontWeight: 700, fontSize: 12 }}>{tech.resolu}</span>
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 3, maxWidth: 70 }}>
                          <div style={{
                            width: `${tech.resolutionRate}%`, height: '100%', borderRadius: 3,
                            background: tech.resolutionRate >= 70 ? '#10b981' : tech.resolutionRate >= 40 ? '#f59e0b' : '#ef4444',
                            transition: 'width 0.6s ease'
                          }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12, minWidth: 36, color: tech.resolutionRate >= 70 ? '#059669' : tech.resolutionRate >= 40 ? '#d97706' : '#dc2626' }}>
                          {tech.resolutionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {techTableData.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>{t('table.noTech')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
            <Indicator color="#10b981" label={t('legend.excellent')} />
            <Indicator color="#f59e0b" label={t('legend.average')} />
            <Indicator color="#ef4444" label={t('legend.weak')} />
          </div>
        </div>
      </div>

      {/* ── Section: Répartition des flux ── */}
      <p className="pp-section-title">{t('section.flowDistribution')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>

        {/* État Actuel des Tickets — Bar Chart */}
        <div className="pp-card">
          <p className="pp-chart-title">{t('chart.currentStatus')}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.statusStats} barCategoryGap="35%" margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name" axisLine={false} tickLine={false} interval={0}
                tick={{ fontSize: 10, fill: '#64748b' }} angle={-35} textAnchor="end" height={60}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {(stats.statusStats || []).map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                ))}
                <LabelList content={<BarTopLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: (stats.statusStats?.length || 0) > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 12 }}>
            {(stats.statusStats || []).map((s, i) => (
              <Indicator key={i} color={getDynamicColor(s.name, i)} label={`${s.name}: ${s.value}`} />
            ))}
          </div>
        </div>

        {/* Distribution par Type — Pie Chart */}
        <div className="pp-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <p className="pp-chart-title">{t('chart.typeDistribution')}</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.typeStats ?? []}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                labelLine={false}
                label={renderPieLabel}
              >
                {(stats.typeStats ?? []).map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} ticket${value > 1 ? 's' : ''}`, name]}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 12px', marginTop: 12 }}>
            {(stats.typeStats ?? []).map((item, i) => (
              <Indicator key={i} color={getDynamicColor(item.name, i)} label={`${item.name}: ${item.value} (${item.percentage}%)`} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Section: Répartition par Catégorie ── */}
      {(stats.categoryStats?.length > 0) && (
        <>
          <p className="pp-section-title">{t('section.categoryDistribution')}</p>
          <div className="pp-card" style={{ marginBottom: 22 }}>
            <p className="pp-chart-title">{t('chart.ticketsByCategory')}</p>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={stats.categoryStats} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {stats.categoryStats.map((entry, index) => (
                    <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                  ))}
                  <LabelList content={<BarTopLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: stats.categoryStats.length > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 12 }}>
              {stats.categoryStats.map((c, i) => (
                <Indicator key={i} color={getDynamicColor(c.name, i)} label={`${c.name}: ${c.value}`} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Section: Tendances Temporelles ── */}
      <p className="pp-section-title">{t('section.timeTrends')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Area chart — Monthly / Daily trend */}
        <div className="pp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <p className="pp-chart-title" style={{ marginBottom: 2 }}>
                {selectedMonth
                  ? `${t('chart.dailyEvolution')} — ${MONTHS.find(m => m.value === parseInt(selectedMonth))?.label} ${selectedYear}`
                  : `${t('chart.monthlyEvolution')} ${selectedYear || new Date().getFullYear()}`}
              </p>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>📅 {filterLabel}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                {t('chart.total')}: <strong style={{ color: '#1e293b' }}>{stats.totalTickets}</strong>
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sortedMonthlyStats} margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e0e7ff" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10.5, fill: '#6366f1', fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Area
                type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5}
                fillOpacity={1} fill="url(#gradIndigo)"
                dot={<AreaDot />} activeDot={false} label={<AreaValueLabel />}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Priorités — Pie Chart */}
        <div className="pp-card">
          <p className="pp-chart-title">{t('chart.priorityDistribution')}</p>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={stats.priorityStats} cx="50%" cy="50%"
                innerRadius={55} outerRadius={85} paddingAngle={3}
                dataKey="value" labelLine={false} label={renderPieLabel}
              >
                {(stats.priorityStats || []).map((entry, index) => (
                  <Cell key={index} fill={getDynamicColor(entry.name, index)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: (stats.priorityStats?.length || 0) > 3 ? 'repeat(2, 1fr)' : '1fr', gap: '4px 12px', marginTop: 10 }}>
            {(stats.priorityStats || []).map((p, i) => (
              <Indicator key={i} color={getDynamicColor(p.name, i)} label={`${p.name}: ${p.value}`} />
            ))}
          </div>
        </div>
      </div>
</div>
    </div>
  );
}