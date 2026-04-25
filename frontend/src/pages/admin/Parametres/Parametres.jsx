import { useEffect, useState } from "react";
import { MdPeople, MdAssignment, MdTimer, MdCheckCircle } from "react-icons/md";

const PRIORITY_LABELS = {
  critical: { label: "Critique", color: "#A32D2D", bg: "#FCEBEB" },
  high:     { label: "Haute",    color: "#854F0B", bg: "#FAEEDA" },
  medium:   { label: "Moyenne",  color: "#185FA5", bg: "#E6F1FB" },
  low:      { label: "Basse",    color: "#3B6D11", bg: "#EAF3DE" },
};

const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

function formatDelai(heures) {
  if (!heures || heures < 1) return "—";
  if (heures < 24) return `${heures} heure${heures > 1 ? "s" : ""}`;
  const jours = heures / 24;
  if (Number.isInteger(jours)) return `${jours} jour${jours > 1 ? "s" : ""}`;
  return `${jours.toFixed(1)} jours`;
}

// ... (Les objets de traduction STATUTS_FR, IMPACTS_FR, etc. restent identiques)
const STATUTS_FR = { open: "Ouvert", in_progress: "En cours", pending: "En attente", pending_supplier: "Attente fournisseur", resolved: "Résolu", closed: "Fermé", rejected: "Rejeté" };
const IMPACTS_FR   = { low: "Faible", medium: "Moyen", high: "Élevé" };
const URGENCES_FR  = { low: "Faible", medium: "Moyenne", high: "Élevée" };
const PRIORITES_FR = { low: "Basse", medium: "Moyenne", high: "Haute", critical: "Critique" };
const ROLES_FR = { employee: "Employé", technician: "Technicien", chef_service: "Chef de service", manager: "Manager", admin: "Administrateur" };
const CATEGORIES_FR = { hardware: "Matériel", software: "Logiciel", network: "Réseau", access: "Accès", security: "Sécurité", account: "Compte" };

export default function ParametresAdmin() {
  const [stats, setStats]     = useState({});
  const [sla, setSla]         = useState([]);
  const [config, setConfig]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
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
    } catch (err) { setError("Erreur de mise à jour."); } finally { setSavingId(null); }
  };

  const slaOrdered = PRIORITY_ORDER.map(p => sla.find(s => s.priority === p)).filter(Boolean);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-[#fefdfd]">
      <div className="w-9 h-9 border-4 border-slate-200 border-t-red-700 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9f6f2] p-8 md:p-10 font-sans">

      {/* HEADER : Titre à gauche, sans icône */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Paramètres administrateur</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0, fontWeight: 500 }}>
            Configuration du système et des règles SLA
          </p>
      </div>

      {/* KPI CARDS : Largeur complète */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-300 rounded-xl p-6 flex items-center gap-5 shadow-sm">
          {/* Icône utilisateur remise en BLEU */}
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <MdPeople className="text-2xl text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Utilisateurs</p>
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
            Configuration SLA
          </h2>
        </div>

        <div className="p-6 pt-2">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f9f6f2] border-b border-gray-300">
                  {['Priorité', 'Durée (heures)', 'Délai indicatif', 'Statut'].map((col, i) => (
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
                        {formatDelai(s.duration_hours)}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold">
                        {savingId === s.id ? <span className="text-blue-600">Enregistrement...</span> : 
                         savedId === s.id ? <span className="text-green-600">✓ Enregistré</span> : 
                         <span className="text-green-500 bg-green-50 px-2 py-0.5 rounded border border-green-100">Actif</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* AJOUT : LA LOI ET LE TEXTE CALCUL AUTOMATIQUE */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
             <p className="text-blue-800 text-xs leading-relaxed">
              <strong className="font-bold">Calcul automatique :</strong> lors de la création du ticket, 
              la date limite de résolution est calculée selon la loi suivante :
            </p>
            <div className="mt-2 inline-block bg-white px-3 py-1.5 border border-blue-200 rounded-lg shadow-sm">
              <code className="text-[11px] font-bold text-blue-700 italic">
                sla_date_limite = date_creation + duration_hours
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* VALEURS SYSTÈME */}
      <div className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h2 className="text-base font-bold text-slate-800">Valeurs du système</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { label: 'Priorités',  items: config?.enums?.priorities || [], map: PRIORITES_FR },
              { label: 'Statuts',    items: config?.enums?.statuses   || [], map: STATUTS_FR   },
              { label: 'Impact',     items: config?.enums?.impacts    || [], map: IMPACTS_FR   },
              { label: 'Urgence',    items: config?.enums?.urgencies  || [], map: URGENCES_FR  },
              { label: 'Catégories', items: config?.enums?.categories || [], map: CATEGORIES_FR },
              { label: 'Rôles',      items: config?.enums?.roles      || [], map: ROLES_FR     },
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