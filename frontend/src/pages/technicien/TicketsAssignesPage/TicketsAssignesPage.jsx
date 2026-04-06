import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import RefreshButton from "../../../components/common/RefreshButton";

// ── Styles badge ─────────────────────────────────
const statutStyle = {
  "Ouvert":                 "bg-blue-100 text-blue-700",
  "En cours":               "bg-yellow-100 text-yellow-700",
  "En attente":             "bg-purple-100 text-purple-700",
  "En attente fournisseur": "bg-orange-100 text-orange-700",
  "Résolu":                 "bg-green-100 text-green-700",
  "Fermé":                  "bg-gray-200 text-gray-600",
  "Rejeté":                 "bg-red-100 text-red-700",
};

const prioriteStyle = {
  "Basse":    "bg-green-100 text-green-700",
  "Normale":  "bg-yellow-100 text-yellow-700",
  "Haute":    "bg-red-100 text-red-700",
  "Critique": "bg-red-200 text-red-800",
};

const categorieStyle = {
  "Logiciels": "bg-purple-100 text-purple-800",
  "Hardware":  "bg-blue-100 text-blue-800",
  "Réseau":    "bg-teal-100 text-teal-800",
  "Accès":     "bg-pink-100 text-pink-800",
  "Sécurité":  "bg-orange-100 text-orange-800",
  "Compte":    "bg-yellow-100 text-yellow-800",
};

// ── Enum mappings EN → FR ─────────────────────────
const statusFR = {
  open:             "Ouvert",
  in_progress:      "En cours",
  pending:          "En attente",
  pending_supplier: "En attente fournisseur",
  resolved:         "Résolu",
  closed:           "Fermé",
  rejected:         "Rejeté",
};

const statusEN = {
  "Ouvert":                 "open",
  "En cours":               "in_progress",
  "En attente":             "pending",
  "En attente fournisseur": "pending_supplier",
  "Résolu":                 "resolved",
  "Fermé":                  "closed",
  "Rejeté":                 "rejected",
};

const priorityFR = {
  low:      "Basse",
  medium:   "Normale",
  high:     "Haute",
  critical: "Critique",
};

const categoryFR = {
  hardware: "Hardware",
  software: "Logiciels",
  network:  "Réseau",
  access:   "Accès",
  security: "Sécurité",
  account:  "Compte",
};

// ── Cartes stats config ───────────────────────────
const STAT_CARDS = [
  { label: "Total",                    key: null,                        cls: "text-gray-700"   },
  { label: "Ouvert",                   key: "Ouvert",                    cls: "text-blue-600"   },
  { label: "En cours",                 key: "En cours",                  cls: "text-yellow-600" },
  { label: "En attente",               key: "En attente",                cls: "text-purple-600" },
  { label: "En attente fournisseur",   key: "En attente fournisseur",    cls: "text-orange-600" },
  { label: "Résolu",                   key: "Résolu",                    cls: "text-green-600"  },
  { label: "Fermé",                    key: "Fermé",                     cls: "text-gray-500"   },
  { label: "Rejeté",                   key: "Rejeté",                    cls: "text-red-600"    },
];

// ── Barre SLA ─────────────────────────────────────
function SlaBar({ slaDueDate }) {
  if (!slaDueDate) return <span className="text-gray-400 text-xs">N/A</span>;

  const now       = Date.now();
  const due       = new Date(slaDueDate).getTime();
  const total     = 24 * 3600 * 1000;
  const remaining = due - now;
  const pct       = Math.min(100, Math.max(0, (remaining / total) * 100));
  const depasse   = remaining <= 0;

  const hours   = Math.floor(Math.abs(remaining) / 3600000);
  const minutes = Math.floor((Math.abs(remaining) % 3600000) / 60000);

  const barColor = depasse
    ? "bg-red-500"
    : pct < 25
      ? "bg-red-400"
      : pct < 60
        ? "bg-yellow-400"
        : "bg-green-400";

  return (
    <div className="flex flex-col gap-1 min-w-[100px]">
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all ${barColor}`}
          style={{ width: depasse ? "100%" : `${100 - pct}%` }}
        />
      </div>
      <span className={`text-xs ${depasse ? "text-red-600 font-medium" : "text-gray-400"}`}>
        {depasse
          ? `⚠ +${hours}h ${minutes}m dépassé`
          : hours > 0
            ? `${hours}h ${minutes}m restantes`
            : `${minutes}m restantes`}
      </span>
    </div>
  );
}

// ── Composant principal ───────────────────────────
export default function TicketsAssignesPage() {
  const navigate = useNavigate();

  const [ticketsData,     setTicketsData]     = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [statuts,         setStatuts]         = useState({});

  const [search,          setSearch]          = useState("");
  const [filterStatut,    setFilterStatut]    = useState("");
  const [filterPriorite,  setFilterPriorite]  = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");

  const [enumStatuts,     setEnumStatuts]     = useState([]);
  const [enumPriorites,   setEnumPriorites]   = useState([]);
  const [enumCategories,  setEnumCategories]  = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));

  // ── Fetch enums (une seule fois) ──────────────────
  useEffect(() => {
    fetch("http://localhost:3001/api/tech/enums")
      .then(r => r.json())
      .then(data => {
        setEnumStatuts(data.statuts.map(s => statusFR[s] ?? s));
        setEnumPriorites(data.priorites.map(p => priorityFR[p] ?? p));
        setEnumCategories(data.categories.map(c => categoryFR[c] ?? c));
      })
      .catch(console.error);
  }, []);

  // ── Fetch tickets ────────────────────────────────
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:3001/api/tech/assigned/${user.id}`);
      if (!res.ok) throw new Error("Erreur fetch");
      const data = await res.json();

      const mapped = data.map(t => ({
        id:          t.id,
        titre:       t.title,
        description: t.description,
        employe:     t.employee_name,
        priorite:    priorityFR[t.priority]  ?? t.priority,
        categorie:   categoryFR[t.category]  ?? t.category,
        statut:      statusFR[t.status]      ?? t.status,
        createdAt:   t.created_at,
       slaDueDate: t.sla_date_limite,
      }));

      setTicketsData(mapped);
      setStatuts(Object.fromEntries(mapped.map(t => [t.id, t.statut])));
    } catch (err) {
      console.error(err);
      setError("Impossible de récupérer les tickets.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // ── Changer statut ───────────────────────────────
  async function changerStatut(e, id, nouveauStatut) {
    e.stopPropagation();
    setStatuts(prev => ({ ...prev, [id]: nouveauStatut }));
    try {
      await fetch(`http://localhost:3001/api/tech/tickets/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusEN[nouveauStatut] }),
      });
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
    }
  }

  // ── Filtrage ─────────────────────────────────────
  const filtered = ticketsData.filter(t => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      String(t.id).includes(q) ||
      t.titre?.toLowerCase().includes(q) ||
      (t.createdAt && new Date(t.createdAt).toLocaleDateString("fr").includes(q));
    return (
      matchSearch &&
      (!filterStatut    || statuts[t.id] === filterStatut) &&
      (!filterPriorite  || t.priorite    === filterPriorite) &&
      (!filterCategorie || t.categorie   === filterCategorie)
    );
  });

  // ── Compteurs ────────────────────────────────────
  const counts = Object.fromEntries(
    STAT_CARDS
      .filter(c => c.key)
      .map(c => [c.key, ticketsData.filter(t => statuts[t.id] === c.key).length])
  );

  const slaDepasses = ticketsData.filter(
    t => t.slaDueDate && new Date(t.slaDueDate) < new Date()
  );

  // ── Rendu ─────────────────────────────────────────
  if (loading) return (
    <div className="p-6 flex items-center gap-2 text-gray-500 text-sm">
      <span className="animate-spin">↻</span> Chargement…
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-600 text-sm bg-red-50 rounded-xl border border-red-200">
      {error}
    </div>
  );

  return (
    <div className="p-6">

      {/* En-tête */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-800">Mes tickets assignés</h1>
        <p className="text-sm text-gray-400 mt-1">
          Suivi des incidents qui vous sont attribués — mettez à jour les statuts et respectez les délais SLA.
        </p>
      </div>

      {/* Alerte SLA */}
      {slaDepasses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          <p className="text-red-700 text-sm font-medium">
            {slaDepasses.length} ticket(s) ont dépassé le délai SLA
          </p>
          <div className="ml-auto flex gap-2 flex-wrap">
            {slaDepasses.map(t => (
              <span
                key={t.id}
                onClick={() => navigate(`/technician/ticket-technicien/${t.id}`)}
                className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium cursor-pointer hover:bg-red-200 transition"
              >
                #{t.id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cartes stats */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
        {STAT_CARDS.map(({ label, key, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
            <p className="text-xs text-gray-400 mb-1 truncate">{label}</p>
            <p className={`text-2xl font-semibold ${cls}`}>
              {key === null ? ticketsData.length : (counts[key] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Recherche par ID, titre ou date…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {enumStatuts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          value={filterPriorite}
          onChange={e => setFilterPriorite(e.target.value)}
        >
          <option value="">Toutes les priorités</option>
          {enumPriorites.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          value={filterCategorie}
          onChange={e => setFilterCategorie(e.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {enumCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          className="text-red-500 border border-red-200 px-3 py-2 rounded-lg text-sm hover:bg-red-50 transition"
          onClick={() => {
            setSearch("");
            setFilterStatut("");
            setFilterPriorite("");
            setFilterCategorie("");
          }}
        >
          Réinitialiser
        </button>

        <div className="ml-auto">
          <RefreshButton onRefresh={fetchTickets} />
        </div>
      </div>

      {/* Compteur résultats */}
      <p className="text-xs text-gray-400 mb-2">
        {filtered.length} ticket(s) affiché(s) sur {ticketsData.length}
      </p>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Titre</th>
              <th className="px-4 py-3 font-medium">Catégorie</th>
              <th className="px-4 py-3 font-medium">Employé</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
              <th className="px-4 py-3 font-medium">Priorité</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">SLA restant</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const depasse = t.slaDueDate && new Date(t.slaDueDate) < new Date();
              return (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/technician/ticket-technicien/${t.id}`)}
                  className={`border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer
                    ${depasse ? "bg-red-50 hover:bg-red-100" : ""}`}
                >
                  {/* ID */}
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                    #{t.id}
                  </td>

                  {/* Titre */}
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px]">
                    <span className="block truncate">{t.titre}</span>
                  </td>

                  {/* Catégorie */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${categorieStyle[t.categorie] ?? "bg-gray-100 text-gray-600"}`}>
                      {t.categorie ?? "N/A"}
                    </span>
                  </td>

                  {/* Employé */}
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {t.employe || "N/A"}
                  </td>

                  {/* Date création */}
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {t.createdAt
                      ? new Date(t.createdAt).toLocaleDateString("fr-FR")
                      : "N/A"}
                  </td>

                  {/* Priorité */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${prioriteStyle[t.priorite] ?? "bg-gray-100 text-gray-600"}`}>
                      {t.priorite ?? "N/A"}
                    </span>
                  </td>

                  {/* Statut — select inline, stop propagation */}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <select
                      value={statuts[t.id] ?? ""}
                      onChange={e => changerStatut(e, t.id, e.target.value)}
                      className={`border-none rounded-full px-2 py-1 text-xs font-medium
                        cursor-pointer focus:outline-none
                        ${statutStyle[statuts[t.id]] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {Object.keys(statusEN).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>

                  {/* SLA */}
                  <td className="px-4 py-3">
                    <SlaBar slaDueDate={t.slaDueDate} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Aucun ticket trouvé
          </div>
        )}
      </div>
    </div>
  );
}