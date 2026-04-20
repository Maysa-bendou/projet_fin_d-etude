import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  MdAssignment, MdTrendingUp, MdTimer, MdCheckCircle, MdCancel, MdPerson 
} from 'react-icons/md';

// ── Fausses données (Inchangées) ───────────────────────────────
const fakeStats = { total: 38, enCours: 12, enAttente: 8, resolus: 15, rejetes: 3 };

const repartitionService = [
  { service: "IT Support", count: 14, color: "#3b82f6", pct: 70 },
  { service: "IT Network", count: 8, color: "#0d9488", pct: 40 },
  { service: "IT Security", count: 6, color: "#ef4444", pct: 30 },
  { service: "Service Desk", count: 6, color: "#f59e0b", pct: 30 },
  { service: "IT Collaboration", count: 4, color: "#8b5cf6", pct: 20 },
];

const repartitionPriorite = [
  { label: "Haute", count: 16, color: "#ef4444", pct: 65 },
  { label: "Normale", count: 14, color: "#f59e0b", pct: 55 },
  { label: "Basse", count: 8, color: "#10b981", pct: 32 },
];

const performanceTechniciens = [
  { nom: "Karim Haddad", initiales: "KH", resolus: 8, color: "bg-blue-600" },
  { nom: "Nadia Ferhat", initiales: "NF", resolus: 6, color: "bg-purple-600" },
  { nom: "Bilal Ouali", initiales: "BO", resolus: 5, color: "bg-indigo-600" },
  { nom: "Ryma Bouzidi", initiales: "RB", resolus: 4, color: "bg-pink-600" },
];

const derniersTickets = [
  { id: "IM000015", titre: "PC ne démarre plus", employe: "Omar Bensaid", service: "IT Support", priorite: "Haute", statut: "En cours" },
  { id: "IM000014", titre: "VPN déconnecté", employe: "Lina Amrani", service: "IT Security", priorite: "Normale", statut: "Résolu" },
  { id: "IM000013", titre: "Mot de passe expiré", employe: "Sara Haddad", service: "Service Desk", priorite: "Basse", statut: "En attente" },
  { id: "IM000012", titre: "Imprimante hors ligne", employe: "Ali Benali", service: "IT Support", priorite: "Normale", statut: "En cours" },
  { id: "IM000011", titre: "Outlook ne s'ouvre plus", employe: "Yacine Meziane", service: "IT Support", priorite: "Haute", statut: "Résolu" },
];

// ── Styles (Harmonisés avec le reste du projet) ───────────────────────────────
const statutStyle = {
  "En cours":   "bg-amber-50 text-amber-600 border-amber-100",
  "Résolu":     "bg-emerald-50 text-emerald-600 border-emerald-100",
  "En attente": "bg-purple-50 text-purple-600 border-purple-100",
  "Rejeté":     "bg-rose-50 text-rose-600 border-rose-100",
};

const prioriteStyle = {
  "Haute":   "bg-rose-50 text-rose-600 border-rose-100",
  "Normale": "bg-amber-50 text-amber-600 border-amber-100",
  "Basse":   "bg-emerald-50 text-emerald-600 border-emerald-100",
};

export default function AccueilManager() {
  const navigate = useNavigate();

  return (
    <div className="p-6 bg-[f5f5dc]] min-h-screen font-sans">

      {/* ── HEADER ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Vue globale des tickets</h1>
        <p className="text-sm text-slate-500 font-medium">Suivi opérationnel en temps réel</p>
      </div>

      {/* ── KPI CARDS (Style Capture 1) ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <KpiCard label="Total" value={fakeStats.total} icon={<MdAssignment />} type="blue" />
        <KpiCard label="En cours" value={fakeStats.enCours} icon={<MdTrendingUp />} type="orange" />
        <KpiCard label="En attente" value={fakeStats.enAttente} icon={<MdTimer />} type="purple" />
        <KpiCard label="Résolus" value={fakeStats.resolus} icon={<MdCheckCircle />} type="green" />
        <KpiCard label="Rejetés" value={fakeStats.rejetes} icon={<MdCancel />} type="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* ── Répartition par service ── */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-3">Par Service</h3>
          <div className="space-y-5">
            {repartitionService.map((item) => (
              <div key={item.service}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{item.service}</span>
                  <span className="text-xs font-black text-slate-800">{item.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Répartition par priorité ── */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-orange-500 pl-3">Par Priorité</h3>
          <div className="space-y-5">
            {repartitionPriorite.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{item.label}</span>
                  <span className="text-xs font-black" style={{ color: item.color }}>{item.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Performance Techniciens ── */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-purple-500 pl-3">Top Techniciens</h3>
          <div className="space-y-4">
            {performanceTechniciens.map((tech) => (
              <div key={tech.nom} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-2xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${tech.color} flex items-center justify-center text-white text-[11px] font-bold shadow-sm`}>
                    {tech.initiales}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{tech.nom}</span>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-100 uppercase">
                  {tech.resolus} Résolus
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── TABLEAU DERNIERS TICKETS (Style Capture 2) ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Dernières Activités</h3>
          <button className="text-[11px] font-bold text-blue-500 uppercase hover:underline">Voir tout</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Titre du ticket</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Priorité</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {derniersTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/manager/ticket/${t.id}`)}>
                  <td className="px-6 py-4 font-mono text-[11px] font-bold text-slate-400">{t.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-700 leading-none mb-1">{t.titre}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{t.employe} • {t.service}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase ${prioriteStyle[t.priorite]}`}>
                      {t.priorite}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase ${statutStyle[t.statut]}`}>
                      {t.statut}
                    </span>
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

// --- SOUS-COMPOSANT KPI (Réutilisable) ---
function KpiCard({ label, value, icon, type }) {
  const styles = {
    blue:   { bg: 'bg-blue-50', text: 'text-blue-500' },
    orange: { bg: 'bg-amber-50', text: 'text-amber-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-500' },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-500' },
    red:    { bg: 'bg-rose-50', text: 'text-rose-500' },
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${styles[type].bg} ${styles[type].text}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}