import React from "react";

// ── Fausses données ───────────────────────────────
const services = [
  {
    nom:        "IT Support",
    total:      14,
    enCours:    5,
    resolus:    6,
    enAttente:  3,
    technicien: "Karim Haddad",
    taux:       43,
    color:      "#2563EB",
    bgColor:    "bg-blue-50 text-blue-700",
    pct:        70,
    priorite:   { haute: 6, normale: 5, basse: 3 },
  },
  {
    nom:        "IT Network",
    total:      8,
    enCours:    3,
    resolus:    4,
    enAttente:  1,
    technicien: "Ryma Bouzidi",
    taux:       50,
    color:      "#0F766E",
    bgColor:    "bg-teal-50 text-teal-700",
    pct:        40,
    priorite:   { haute: 4, normale: 3, basse: 1 },
  },
  {
    nom:        "IT Security",
    total:      6,
    enCours:    2,
    resolus:    3,
    enAttente:  1,
    technicien: "Nadia Ferhat",
    taux:       50,
    color:      "#DC2626",
    bgColor:    "bg-red-50 text-red-700",
    pct:        30,
    priorite:   { haute: 4, normale: 2, basse: 0 },
  },
  {
    nom:        "Service Desk",
    total:      6,
    enCours:    2,
    resolus:    2,
    enAttente:  2,
    technicien: "Bilal Ouali",
    taux:       33,
    color:      "#F97316",
    bgColor:    "bg-orange-50 text-orange-700",
    pct:        30,
    priorite:   { haute: 1, normale: 3, basse: 2 },
  },
  {
    nom:        "IT Collaboration",
    total:      4,
    enCours:    2,
    resolus:    0,
    enAttente:  2,
    technicien: "Selma Hadjar",
    taux:       0,
    color:      "#8B5CF6",
    bgColor:    "bg-purple-50 text-purple-700",
    pct:        20,
    priorite:   { haute: 2, normale: 2, basse: 0 },
  },
];

// ── Couleur taux résolution ───────────────────────
function couleurTaux(taux) {
  if (taux >= 50) return "bg-green-50 text-green-700";
  if (taux >= 30) return "bg-yellow-50 text-yellow-700";
  return "bg-red-50 text-red-700";
}

export default function RepartitionPage() {
  return (
    <div className="p-6">

      {/* ── Titre ── */}
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Répartition par service
      </h1>

      {/* ── Cartes par service ── */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {services.map((s) => (
          <div key={s.nom} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-2">{s.nom}</p>
            <p className="text-2xl font-semibold mb-2" style={{ color: s.color }}>
              {s.total}
            </p>
            <div className="bg-gray-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full"
                style={{ width: `${s.pct}%`, background: s.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Statut + Priorité par service ── */}
      <div className="grid grid-cols-2 gap-4 mb-4">

        {/* Statut par service */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">
            Statut par service
          </p>
          <div className="flex flex-col gap-4">
            {services.map((s) => (
              <div key={s.nom} className="flex items-center justify-between">
                <span className="text-xs text-gray-500 w-28 shrink-0">{s.nom}</span>
                <div className="flex gap-1.5">
                  <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                    En cours: {s.enCours}
                  </span>
                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs">
                    Résolu: {s.resolus}
                  </span>
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs">
                    Attente: {s.enAttente}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priorité par service */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">
            Priorité par service
          </p>
          <div className="flex flex-col gap-4">
            {services.map((s) => (
              <div key={s.nom} className="flex items-center justify-between">
                <span className="text-xs text-gray-500 w-28 shrink-0">{s.nom}</span>
                <div className="flex gap-1.5">
                  <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs">
                    Haute: {s.priorite.haute}
                  </span>
                  <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                    Normale: {s.priorite.normale}
                  </span>
                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs">
                    Basse: {s.priorite.basse}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Tableau détaillé ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-800 mb-4">
          Tableau détaillé par service
        </p>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Service</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Total</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">En cours</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Résolus</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">En attente</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Technicien principal</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Taux résolution</th>
            </tr>
          </thead>

          <tbody>
            {services.map((s) => (
              <tr key={s.nom} className="border-t border-gray-100 hover:bg-gray-50 transition">

                {/* Service */}
                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bgColor}`}>
                    {s.nom}
                  </span>
                </td>

                {/* Total */}
                <td className="px-3 py-3 font-medium text-gray-800">{s.total}</td>

                {/* En cours */}
                <td className="px-3 py-3 text-yellow-600">{s.enCours}</td>

                {/* Résolus */}
                <td className="px-3 py-3 text-green-600">{s.resolus}</td>

                {/* En attente */}
                <td className="px-3 py-3 text-purple-600">{s.enAttente}</td>

                {/* Technicien */}
                <td className="px-3 py-3 text-gray-500 text-xs">{s.technicien}</td>

                {/* Taux */}
                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${couleurTaux(s.taux)}`}>
                    {s.taux}%
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