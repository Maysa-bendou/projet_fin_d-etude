import React from "react";

// ── Fausses données ───────────────────────────────
const fakeStats = {
  tempsMoyen:      "4.2h",
  slaRespecte:     28,
  slaDepasse:      7,
  tauxResolution:  "80%",
};

const techniciens = [
  { rang: "🥇", initiales: "KH", nom: "Karim Haddad",  assigne: 10, resolus: 8, taux: 80, tempsMoyen: "3.5h", sla: true  },
  { rang: "🥈", initiales: "NF", nom: "Nadia Ferhat",  assigne: 9,  resolus: 6, taux: 67, tempsMoyen: "4.2h", sla: true  },
  { rang: "🥉", initiales: "BO", nom: "Bilal Ouali",   assigne: 8,  resolus: 5, taux: 62, tempsMoyen: "5.1h", sla: false },
  { rang: "4",  initiales: "RB", nom: "Ryma Bouzidi",  assigne: 6,  resolus: 4, taux: 55, tempsMoyen: "6.3h", sla: false },
  { rang: "5",  initiales: "DA", nom: "Djamel Allal",  assigne: 5,  resolus: 3, taux: 60, tempsMoyen: "4.8h", sla: true  },
];

// ── Couleur taux résolution ───────────────────────
function couleurTaux(taux) {
  if (taux >= 75) return "#0F766E";
  if (taux >= 60) return "#F97316";
  return "#DC2626";
}

export default function PerformancesPage() {
  return (
    <div className="p-6">

      {/* ── Titre ── */}
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Suivi des performances
      </h1>

      {/* ── Cartes stats ── */}
      <div className="grid grid-cols-4 gap-4 mb-5">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-2">Temps moyen résolution</p>
          <p className="text-2xl font-semibold text-blue-600">
            {fakeStats.tempsMoyen}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-2">SLA Respecté</p>
          <p className="text-2xl font-semibold text-teal-600">
            {fakeStats.slaRespecte}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-2">SLA Dépassé</p>
          <p className="text-2xl font-semibold text-red-600">
            {fakeStats.slaDepasse}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-2">Taux résolution global</p>
          <p className="text-2xl font-semibold text-orange-500">
            {fakeStats.tauxResolution}
          </p>
        </div>

      </div>

      {/* ── SLA Respecté vs Dépassé ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <p className="text-sm font-semibold text-gray-800 mb-4">
          SLA Respecté vs Dépassé
        </p>

        {/* Barre SLA respecté */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-gray-500 w-20 shrink-0">Respecté</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-teal-600 h-2.5 rounded-full"
              style={{ width: `${(fakeStats.slaRespecte / (fakeStats.slaRespecte + fakeStats.slaDepasse)) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-teal-600 w-20 text-right">
            {fakeStats.slaRespecte} (80%)
          </span>
        </div>

        {/* Barre SLA dépassé */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-20 shrink-0">Dépassé</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-red-600 h-2.5 rounded-full"
              style={{ width: `${(fakeStats.slaDepasse / (fakeStats.slaRespecte + fakeStats.slaDepasse)) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-red-600 w-20 text-right">
            {fakeStats.slaDepasse} (20%)
          </span>
        </div>
      </div>

      {/* ── Classement techniciens ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-800 mb-4">
          Classement techniciens
        </p>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">#</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Technicien</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Assignés</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Résolus</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Taux résolution</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Temps moyen</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">SLA</th>
            </tr>
          </thead>

          <tbody>
            {techniciens.map((tech, index) => (
              <tr key={index} className="border-t border-gray-100 hover:bg-gray-50 transition">

                {/* Rang */}
                <td className="px-3 py-3 font-medium text-gray-500">
                  {tech.rang}
                </td>

                {/* Nom + initiales */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-900 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-medium">
                        {tech.initiales}
                      </span>
                    </div>
                    <span className="text-sm text-gray-800">{tech.nom}</span>
                  </div>
                </td>

                {/* Assignés */}
                <td className="px-3 py-3 text-gray-500">{tech.assigne}</td>

                {/* Résolus */}
                <td className="px-3 py-3 font-medium text-teal-600">
                  {tech.resolus}
                </td>

                {/* Taux résolution avec barre */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-16">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${tech.taux}%`,
                          background: couleurTaux(tech.taux)
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium w-8"
                      style={{ color: couleurTaux(tech.taux) }}
                    >
                      {tech.taux}%
                    </span>
                  </div>
                </td>

                {/* Temps moyen */}
                <td className="px-3 py-3 text-gray-500">{tech.tempsMoyen}</td>

                {/* SLA */}
                <td className="px-3 py-3">
                  {tech.sla ? (
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      ✓ OK
                    </span>
                  ) : (
                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      ⚠ Dépassé
                    </span>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}