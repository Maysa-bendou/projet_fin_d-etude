import React from "react";
import { useNavigate } from "react-router-dom";

// ── Fausses données ───────────────────────────────
const fakeStats = {
  total:     38,
  enCours:   12,
  enAttente: 8,
  resolus:   15,
  rejetes:   3,
};

const repartitionService = [
  { service: "IT Support",       count: 14, color: "#2563EB", pct: 70 },
  { service: "IT Network",       count: 8,  color: "#0F766E", pct: 40 },
  { service: "IT Security",      count: 6,  color: "#DC2626", pct: 30 },
  { service: "Service Desk",     count: 6,  color: "#F97316", pct: 30 },
  { service: "IT Collaboration", count: 4,  color: "#8B5CF6", pct: 20 },
];

const repartitionPriorite = [
  { label: "Haute",   count: 16, color: "#DC2626", pct: 65 },
  { label: "Normale", count: 14, color: "#F97316", pct: 55 },
  { label: "Basse",   count: 8,  color: "#0F766E", pct: 32 },
];

const performanceTechniciens = [
  { nom: "Karim Haddad",  initiales: "KH", resolus: 8 },
  { nom: "Nadia Ferhat",  initiales: "NF", resolus: 6 },
  { nom: "Bilal Ouali",   initiales: "BO", resolus: 5 },
  { nom: "Ryma Bouzidi",  initiales: "RB", resolus: 4 },
];

const derniersTickets = [
  { id: "IM000015", titre: "PC ne démarre plus",     employe: "Omar Bensaid", service: "IT Support",  priorite: "Haute",   statut: "En cours"   },
  { id: "IM000014", titre: "VPN déconnecté",         employe: "Lina Amrani",  service: "IT Security", priorite: "Normale", statut: "Résolu"     },
  { id: "IM000013", titre: "Mot de passe expiré",    employe: "Sara Haddad",  service: "Service Desk",priorite: "Basse",   statut: "En attente" },
  { id: "IM000012", titre: "Imprimante hors ligne",  employe: "Ali Benali",   service: "IT Support",  priorite: "Normale", statut: "En cours"   },
  { id: "IM000011", titre: "Outlook ne s'ouvre plus",employe: "Yacine Meziane",service: "IT Support", priorite: "Haute",   statut: "Résolu"     },
];

// ── Couleurs statut ───────────────────────────────
const statutStyle = {
  "En cours":   "bg-yellow-100 text-yellow-700",
  "Résolu":     "bg-green-100 text-green-700",
  "En attente": "bg-purple-100 text-purple-700",
  "Rejeté":     "bg-red-100 text-red-700",
  "Fermé":      "bg-gray-100 text-gray-700",
};

const prioriteStyle = {
  "Haute":   "bg-red-100 text-red-700",
  "Normale": "bg-yellow-100 text-yellow-700",
  "Basse":   "bg-green-100 text-green-700",
};

const serviceStyle = {
  "IT Support":       "bg-blue-50 text-blue-700",
  "IT Network":       "bg-teal-50 text-teal-700",
  "IT Security":      "bg-red-50 text-red-700",
  "Service Desk":     "bg-orange-50 text-orange-700",
  "IT Collaboration": "bg-purple-50 text-purple-700",
};

export default function AccueilManager() {
  const navigate = useNavigate();

  return (
    <div className="p-6">

      {/* ── Titre ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Vue globale des tickets
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Suivi en temps réel de tous les tickets DJEZZY
          </p>
        </div>
      </div>

      {/* ── Cartes stats colorées ── */}
      <div className="grid grid-cols-5 gap-3 mb-5">

        {[
          { label: "Total",      value: fakeStats.total,     color: "bg-blue-600" },
          { label: "En cours",   value: fakeStats.enCours,   color: "bg-orange-500" },
          { label: "En attente", value: fakeStats.enAttente, color: "bg-purple-500" },
          { label: "Résolus",    value: fakeStats.resolus,   color: "bg-teal-600" },
          { label: "Rejetés",    value: fakeStats.rejetes,   color: "bg-red-600" },
        ].map((stat) => (
          <div key={stat.label} className={`relative ${stat.color} rounded-2xl p-4 overflow-hidden`}>
            <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/20" />
            <div className="absolute right-3 top-4 w-8 h-8 rounded-full bg-white/15" />
            <p className="text-xs text-white/80 mb-1 relative z-10">{stat.label}</p>
            <p className="text-3xl font-semibold text-white relative z-10">{stat.value}</p>
          </div>
        ))}

      </div>

      {/* ── Répartitions ── */}
      <div className="grid grid-cols-2 gap-4 mb-4">

        {/* Répartition par service */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">
            Répartition par service
          </p>
          <div className="flex flex-col gap-3">
            {repartitionService.map((item) => (
              <div key={item.service}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-500">{item.service}</span>
                  <span className="text-xs font-medium text-gray-800">{item.count}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${item.pct}%`, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par priorité + performance techniciens */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

          {/* Priorité */}
          <p className="text-sm font-semibold text-gray-800 mb-4">
            Répartition par priorité
          </p>
          <div className="flex flex-col gap-3 mb-5">
            {repartitionPriorite.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="text-xs font-medium" style={{ color: item.color }}>
                    {item.count}
                  </span>
                </div>
                <div className="bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${item.pct}%`, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Performance techniciens */}
          <p className="text-sm font-semibold text-gray-800 mb-3">
            Performance techniciens
          </p>
          <div className="flex flex-col gap-2">
            {performanceTechniciens.map((tech) => (
              <div key={tech.nom} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-900 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-medium">{tech.initiales}</span>
                  </div>
                  <span className="text-xs text-gray-700">{tech.nom}</span>
                </div>
                <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {tech.resolus} résolus
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Derniers tickets ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-800 mb-4">
          Derniers tickets
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">ID</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Titre</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Employé</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Service</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Priorité</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Statut</th>
            </tr>
          </thead>
          <tbody>
            {derniersTickets.map((t) => (
              <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                onClick={() => navigate(`/manager/ticket/${t.id}`)}>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-400">{t.id}</td>
                <td className="px-3 py-2.5 font-medium text-gray-800">{t.titre}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{t.employe}</td>
                <td className="px-3 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${serviceStyle[t.service] || "bg-gray-100 text-gray-600"}`}>
                    {t.service}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioriteStyle[t.priorite]}`}>
                    {t.priorite}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statutStyle[t.statut]}`}>
                    {t.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}