import { useEffect, useState } from "react";

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

const STATUTS_FR = {
  open:             "Ouvert",
  in_progress:      "En cours",
  pending:          "En attente",
  pending_supplier: "Attente fournisseur",
  resolved:         "Résolu",
  closed:           "Fermé",
  rejected:         "Rejeté",
};

const IMPACTS_FR   = { low: "Faible", medium: "Moyen", high: "Élevé" };
const URGENCES_FR  = { low: "Faible", medium: "Moyenne", high: "Élevée" };
const PRIORITES_FR = { low: "Basse", medium: "Moyenne", high: "Haute", critical: "Critique" };
const ROLES_FR = {
  employee:      "Employé",
  technician:    "Technicien",
  chef_service:  "Chef de service",
  manager:       "Manager",
  admin:         "Administrateur",
};
const CATEGORIES_FR = {
  hardware: "Matériel",
  software: "Logiciel",
  network:  "Réseau",
  access:   "Accès",
  security: "Sécurité",
  account:  "Compte",
};

export default function ParametresAdmin() {
  const [stats, setStats]   = useState({});
  const [sla, setSla]       = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId]   = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [statsRes, configRes, slaRes] = await Promise.all([
          fetch("http://localhost:3001/api/admin/stats", { headers }).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          }),
          fetch("http://localhost:3001/api/admin/config", { headers }).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          }),
          fetch("http://localhost:3001/api/sla", { headers }).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          }),
        ]);

        setStats(statsRes);
        setConfig(configRes);
        setSla(slaRes);
      } catch (err) {
        setError(err.message);
        console.error("Erreur chargement paramètres :", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const updateSla = async (id, value) => {
    const parsed = parseInt(value);
    if (!parsed || parsed < 1) return;

    // Optimistic update
    setSla(prev => prev.map(s => s.id === id ? { ...s, duration_hours: parsed } : s));

    setSavingId(id);
    setSavedId(null);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/api/sla/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ duration_hours: parsed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      console.error("Erreur mise à jour SLA :", err);
      setError("Échec de la mise à jour du SLA.");
    } finally {
      setSavingId(null);
    }
  };

  // Sort SLA by priority order
  const slaOrdered = PRIORITY_ORDER
    .map(p => sla.find(s => s.priority === p))
    .filter(Boolean);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* En-tête */}
      <div>
        <h1 className="text-xl font-medium text-gray-900">Paramètres administrateur</h1>
        <p className="text-sm text-gray-500 mt-1">Configuration du système et des règles SLA</p>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Chargement */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Chargement...</div>
      ) : (
        <>
          {/* STATS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Utilisateurs</p>
              <p className="text-3xl font-medium text-gray-900">{stats.totalUsers ?? "—"}</p>
              <p className="text-xs text-gray-400 mt-1">comptes enregistrés</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tickets</p>
              <p className="text-3xl font-medium text-gray-900">{stats.totalTickets ?? "—"}</p>
              <p className="text-xs text-gray-400 mt-1">tickets au total</p>
            </div>
          </div>

          {/* SLA */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="mb-1">
              <h2 className="text-base font-medium text-gray-900">Configuration SLA</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Durée maximale de résolution par priorité. Appliquée automatiquement à la création de chaque ticket.
              </p>
            </div>

            <div className="mt-4 rounded-lg overflow-hidden border border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">Priorité</th>
                    <th className="text-left px-4 py-3 font-medium">Durée (heures)</th>
                    <th className="text-left px-4 py-3 font-medium">Délai indicatif</th>
                    <th className="text-left px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {slaOrdered.map(s => {
                    const p = PRIORITY_LABELS[s.priority] || { label: s.priority, color: "#555", bg: "#eee" };
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{ background: p.bg, color: p.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: p.color }} />
                            {p.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              value={s.duration_hours}
                              onChange={e => updateSla(s.id, e.target.value)}
                              className="border border-gray-200 rounded-md px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                            />
                            <span className="text-xs text-gray-400">h</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDelai(s.duration_hours)}
                        </td>
                        <td className="px-4 py-3">
                          {savingId === s.id && (
                            <span className="text-xs text-blue-500">Enregistrement...</span>
                          )}
                          {savedId === s.id && (
                            <span className="text-xs text-green-600">✓ Enregistré</span>
                          )}
                          {savingId !== s.id && savedId !== s.id && (
                            <span className="text-xs text-green-600">Actif</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg">
              <strong>Calcul automatique :</strong> lors de la création du ticket,{" "}
              <code className="bg-blue-100 px-1 rounded">sla_date_limite = sla_date_debut + duration_hours</code>{" "}
              selon la priorité choisie.
            </div>
          </div>

          {/* VALEURS SYSTÈME */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-base font-medium text-gray-900 mb-4">Valeurs du système</h2>

            <div className="grid grid-cols-2 gap-5">

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Priorités</p>
                <div className="flex flex-wrap gap-1.5">
                  {(config?.enums?.priorities || []).map(p => (
                    <span key={p} className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 bg-gray-50">
                      {PRIORITES_FR[p] || p}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Statuts</p>
                <div className="flex flex-wrap gap-1.5">
                  {(config?.enums?.statuses || []).map(s => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 bg-gray-50">
                      {STATUTS_FR[s] || s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Impact</p>
                <div className="flex flex-wrap gap-1.5">
                  {(config?.enums?.impacts || []).map(i => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 bg-gray-50">
                      {IMPACTS_FR[i] || i}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Urgence</p>
                <div className="flex flex-wrap gap-1.5">
                  {(config?.enums?.urgencies || []).map(u => (
                    <span key={u} className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 bg-gray-50">
                      {URGENCES_FR[u] || u}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Catégories</p>
                <div className="flex flex-wrap gap-1.5">
                  {(config?.enums?.categories || []).map(c => (
                    <span key={c} className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 bg-gray-50">
                      {CATEGORIES_FR[c] || c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Rôles</p>
                <div className="flex flex-wrap gap-1.5">
                  {(config?.enums?.roles || []).map(r => (
                    <span key={r} className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 bg-gray-50">
                      {ROLES_FR[r] || r}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </>
      )}
    </div>
  );
}