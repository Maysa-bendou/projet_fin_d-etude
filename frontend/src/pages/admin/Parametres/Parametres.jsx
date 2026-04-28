import { useEffect, useState } from "react";
import { MdPeople, MdAssignment, MdTimer, MdCheckCircle } from "react-icons/md";

const PRIORITY_LABELS = {
  critical: { label: "Critical", color: "#A32D2D", bg: "#FCEBEB" },
  high:     { label: "High",     color: "#854F0B", bg: "#FAEEDA" },
  medium:   { label: "Medium",   color: "#185FA5", bg: "#E6F1FB" },
  low:      { label: "Low",      color: "#3B6D11", bg: "#EAF3DE" },
};

const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

function formatDeadline(hours) {
  if (!hours || hours < 1) return "—";
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""}`;
  const days = hours / 24;
  if (Number.isInteger(days)) return `${days} day${days > 1 ? "s" : ""}`;
  return `${days.toFixed(1)} days`;
}

const STATUSES_EN    = { open: "Open", in_progress: "In Progress", pending: "Pending", pending_supplier: "Awaiting Supplier", resolved: "Resolved", closed: "Closed", rejected: "Rejected" };
const IMPACTS_EN     = { low: "Low", medium: "Medium", high: "High" };
const URGENCIES_EN   = { low: "Low", medium: "Medium", high: "High" };
const PRIORITIES_EN  = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const ROLES_EN       = { employee: "Employee", technician: "Technician", chef_service: "Service Manager", manager: "Manager", admin: "Administrator" };
const CATEGORIES_EN  = { hardware: "Hardware", software: "Software", network: "Network", access: "Access", security: "Security", account: "Account" };

export default function ParametresAdmin() {
  const [stats, setStats]       = useState({});
  const [sla, setSla]           = useState([]);
  const [config, setConfig]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId]   = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
        const [statsRes, configRes, slaRes] = await Promise.all([
          fetch("http://localhost:3001/api/admin/stats", { headers }).then(r => r.json()),
          fetch("http://localhost:3001/api/admin/config", { headers }).then(r => r.json()),
          fetch("http://localhost:3001/api/sla", { headers }).then(r => r.json()),
        ]);
        setStats(statsRes);
        setConfig(configRes);
        setSla(slaRes);
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    loadData();
  }, []);

  const updateSla = async (id, value) => {
    const parsed = parseInt(value);
    if (!parsed || parsed < 1) return;
    setSla(prev => prev.map(s => s.id === id ? { ...s, duration_hours: parsed } : s));
    setSavingId(id);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await fetch(`http://localhost:3001/api/sla/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ duration_hours: parsed }),
      });
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) { setError("Update error."); } finally { setSavingId(null); }
  };

  const slaOrdered = PRIORITY_ORDER.map(p => sla.find(s => s.priority === p)).filter(Boolean);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-[#fefdfd]">
      <div className="w-9 h-9 border-4 border-slate-200 border-t-red-700 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f7] p-8 md:p-10 font-sans">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Administrator Settings</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0, fontWeight: 500 }}>
          System configuration and SLA rules
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-300 rounded-xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <MdPeople className="text-2xl text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Users</p>
            <p className="text-3xl font-black text-slate-900">{stats.totalUsers ?? "—"}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <MdAssignment className="text-2xl text-red-700" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tickets</p>
            <p className="text-3xl font-black text-slate-900">{stats.totalTickets ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* SLA CARD */}
      <div className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <MdTimer className="text-red-700 text-xl" />
            SLA Configuration
          </h2>
        </div>

        <div className="p-6 pt-2">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#faf9f7] border-b border-gray-300">
                  {['Priority', 'Duration (hours)', 'Indicative Deadline', 'Status'].map((col, i) => (
                    <th key={i} className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-left">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {slaOrdered.map((s) => {
                  const p = PRIORITY_LABELS[s.priority] || { label: s.priority, color: '#555', bg: '#eee' };
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: p.bg, color: p.color }}>
                          {p.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={s.duration_hours}
                          onChange={e => updateSla(s.id, e.target.value)}
                          className="w-20 px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-md text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {formatDeadline(s.duration_hours)}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold">
                        {savingId === s.id ? <span className="text-blue-600">Saving...</span> :
                         savedId  === s.id ? <span className="text-green-600">✓ Saved</span> :
                         <span className="text-green-500 bg-green-50 px-2 py-0.5 rounded border border-green-100">Active</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* AUTO-CALCULATION NOTE */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-blue-800 text-xs leading-relaxed">
              <strong className="font-bold">Automatic calculation:</strong> when a ticket is created,
              the resolution deadline is calculated according to the following rule:
            </p>
            <div className="mt-2 inline-block bg-white px-3 py-1.5 border border-blue-200 rounded-lg shadow-sm">
              <code className="text-[11px] font-bold text-blue-700 italic">
                sla_deadline = creation_date + duration_hours
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* SYSTEM VALUES */}
      <div className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h2 className="text-base font-bold text-slate-800">System Values</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { label: 'Priorities',  items: config?.enums?.priorities || [], map: PRIORITIES_EN },
              { label: 'Statuses',    items: config?.enums?.statuses   || [], map: STATUSES_EN   },
              { label: 'Impact',      items: config?.enums?.impacts    || [], map: IMPACTS_EN    },
              { label: 'Urgency',     items: config?.enums?.urgencies  || [], map: URGENCIES_EN  },
              { label: 'Categories',  items: config?.enums?.categories || [], map: CATEGORIES_EN },
              { label: 'Roles',       items: config?.enums?.roles      || [], map: ROLES_EN      },
            ].map(({ label, items, map }) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map(item => (
                    <span key={item} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-600">
                      {map[item] || item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}