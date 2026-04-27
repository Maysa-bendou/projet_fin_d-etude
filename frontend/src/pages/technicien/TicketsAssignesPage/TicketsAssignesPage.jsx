import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import RefreshButton from "../../../components/common/RefreshButton";
import {
  HiOutlineTicket, HiOutlineArchiveBox, HiOutlineChevronDown,
} from "react-icons/hi2";

// ── Constants ─────────────────────────────────────
const THIS_YEAR = new Date().getFullYear();

const statutStyle = {
  "Ouvert":                 "bg-blue-100 text-blue-700",     // #1d4ed8
  "En cours":               "bg-violet-100 text-violet-700", // #7c3aed
  "En attente":             "bg-yellow-100 text-yellow-700", // #a16207
  "En attente fournisseur": "bg-orange-100 text-orange-700", // #c2410c
  "Résolu":                 "bg-green-100 text-green-700",   // #15803d
  "Fermé":                  "bg-gray-100 text-gray-500",     // #6b7280
  "Rejeté":                 "bg-red-100 text-red-600",       // #dc2626
};

const prioriteStyle = {
  "Haute":   "bg-orange-100 text-orange-600",   // #ea580c
  "Normale": "bg-yellow-100 text-yellow-600",   // #ca8a04
  "Basse":   "bg-green-100 text-green-700",     // #16a34a
};

const categorieStyle = {
  "Hardware":                  "bg-blue-100 text-blue-700",    // #1d4ed8
  "Logiciels":                 "bg-violet-100 text-violet-700",// #7c3aed
  "Réseau":                    "bg-teal-100 text-teal-700",    // #0f766e
  "Sécurité":                  "bg-orange-100 text-orange-700",// #c2410c
  "Accès":                     "bg-indigo-100 text-indigo-700",// #4338ca
  "Collaboration & Messagerie":"bg-pink-100 text-pink-700",    // #db2777
};

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

const priorityFR = { low: "Basse", medium: "Normale", high: "Haute" }; // ← supprimer critical
const categoryFR = { hardware: "Hardware", software: "Logiciels", network: "Réseau", access: "Accès", security: "Sécurité", messagerie: "Collaboration & Messagerie" };
const STAT_CARDS = [
  { label: "Total",                  key: null,                      cls: "text-gray-700"   },
  { label: "Ouvert",                 key: "Ouvert",                  cls: "text-blue-600"   },
  { label: "En cours",               key: "En cours",                cls: "text-yellow-600" },
  { label: "En attente",             key: "En attente",              cls: "text-purple-600" },
  { label: "Att. fournisseur",       key: "En attente fournisseur",  cls: "text-orange-600" },
  { label: "Résolu",                 key: "Résolu",                  cls: "text-green-600"  },
  { label: "Fermé",                  key: "Fermé",                   cls: "text-gray-500"   },
  { label: "Rejeté",                 key: "Rejeté",                  cls: "text-red-600"    },
];

// ── Helpers ───────────────────────────────────────
const fmtDate = (str) => {
  if (!str) return "N/A";
  const d = new Date(str);
  if (isNaN(d)) return "N/A";
 return d.toLocaleDateString("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
};

const isArchived = (t) => {
  const terminal = ["Résolu", "Fermé", "Rejeté"];
  if (!terminal.includes(t.statut)) return false;
  const ref = t.closedAt || t.createdAt;
  if (!ref) return false;
  return new Date(ref).getFullYear() < THIS_YEAR;
};

const getArchiveYear = (t) => {
  const ref = t.closedAt || t.createdAt;
  return ref ? new Date(ref).getFullYear() : null;
};

// ── SLA Bar ───────────────────────────────────────
// Nouveau SlaBar
function SlaBar({ slaDueDate, statut, closedAt, slaPauseElapsed }) {
  if (!slaDueDate) return <span className="text-gray-400 text-xs">N/A</span>;

  const PAUSED   = ["En attente", "En attente fournisseur"];
  const TERMINAL = ["Résolu", "Fermé", "Rejeté"];
  const now      = Date.now();
  const due      = new Date(slaDueDate).getTime();
  const debut    = due - 24 * 3600 * 1000; // fenêtre SLA
  const window   = due - debut;

  // ── Terminal : bilan figé ──
  if (TERMINAL.includes(statut)) {
    const closed  = closedAt ? new Date(closedAt).getTime() : due;
    const exceeded = closed > due;
    const used    = Math.min(window, window - (due - closed));
    const pct     = Math.round(Math.min(100, Math.max(0, (used / window) * 100)));
    const delta   = Math.abs(closed - due);
    const h = Math.floor(delta / 3600000), m = Math.floor((delta % 3600000) / 60000);
    return (
      <div className="flex flex-col gap-1 min-w-[140px]">
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-1.5 rounded-full ${exceeded ? "bg-red-400" : "bg-green-400"}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${exceeded ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-500"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${exceeded ? "bg-red-400" : "bg-gray-400"}`} />
          {exceeded ? `Clôturé — dépassé de ${h}h ${m}m` : `Clôturé — respecté`}
        </span>
      </div>
    );
  }

  // ── Pause : figé ──
  if (PAUSED.includes(statut)) {
    const frozen  = slaPauseElapsed != null ? window - slaPauseElapsed : Math.max(0, due - now);
    const pct     = Math.round(Math.min(100, Math.max(0, ((window - frozen) / window) * 100)));
    const h = Math.floor(frozen / 3600000), m = Math.floor((frozen % 3600000) / 60000);
    return (
      <div className="flex flex-col gap-1 min-w-[140px]">
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-1.5 rounded-full bg-purple-400" style={{ width: `${pct}%` }} />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          {`Pause — ${h}h ${m}m figé`}
        </span>
      </div>
    );
  }

  // ── Actif ──
  const remaining = due - now;
  const exceeded  = remaining <= 0;
  const pct       = Math.round(Math.min(100, Math.max(0, ((window - Math.max(0, remaining)) / window) * 100)));
  const abs       = Math.abs(remaining);
  const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
  const barCls    = exceeded ? "bg-red-500" : pct > 75 ? "bg-orange-400" : pct > 40 ? "bg-yellow-400" : "bg-green-400";
  const badge     = exceeded
    ? { bg: "bg-red-50 text-red-700",     dot: "bg-red-500 animate-pulse",    label: `Dépassé — +${h}h ${m}m` }
    : pct > 75
    ? { bg: "bg-orange-50 text-orange-700", dot: "bg-orange-400 animate-pulse", label: `En cours — ${h}h ${m}m` }
    : { bg: "bg-green-50 text-green-700",  dot: "bg-green-500",               label: `Respecté — ${h}h ${m}m` };

  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-1.5 rounded-full transition-all ${barCls}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
        {badge.label}
      </span>
    </div>
  );
}
// ── TabSwitch ─────────────────────────────────────
const TabSwitch = memo(({ activeTab, setActiveTab, actuelCount, archiveCount }) => {
  const tabs = [
    { key: "actuels",  label: "Tickets actuels",               Icon: HiOutlineTicket,    count: actuelCount  },
    { key: "archives", label: `Archives (avant ${THIS_YEAR})`, Icon: HiOutlineArchiveBox, count: archiveCount },
  ];
  return (
    <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1 mb-5 border border-gray-200">
      {tabs.map(({ key, label, Icon, count }) => {
        const on = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all border
              ${on
                ? "bg-white border-blue-200 text-blue-700 shadow-sm font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            <Icon size={14} />
            {label}
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold
              ${on ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
});

// ── Main ──────────────────────────────────────────
export default function TicketsAssignesPage() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);

  const [ticketsData,     setTicketsData]     = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [statuts,         setStatuts]         = useState({});

  const [activeTab,       setActiveTab]       = useState("actuels");
  const [search,          setSearch]          = useState("");
  const [filterStatut,    setFilterStatut]    = useState("");
  const [filterPriorite,  setFilterPriorite]  = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");
  const [filterYear,      setFilterYear]      = useState("");

  const [enumStatuts,     setEnumStatuts]     = useState([]);
  const [enumPriorites,   setEnumPriorites]   = useState([]);
  const [enumCategories,  setEnumCategories]  = useState([]);

  // Fetch enums
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

  // Fetch tickets
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
        employe:     t.employee_name,
        priorite:    priorityFR[t.priority]  ?? t.priority,
        categorie:   categoryFR[t.category]  ?? t.category,
        statut:      statusFR[t.status]      ?? t.status,
        createdAt:   t.created_at,
        assignedAt:  t.assigned_at,
        closedAt:    t.closed_at,
        slaDueDate:  t.sla_date_limite,
        slaStatut:          t.sla_statut,
slaPauseElapsed:    t.sla_pause_elapsed_ms ?? null,
      }));
      setTicketsData(mapped);
      setStatuts(Object.fromEntries(mapped.map(t => [t.id, t.statut])));
    } catch (err) {
      setError("Impossible de récupérer les tickets.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Change status
  async function changerStatut(e, id, nouveauStatut) {

    e.stopPropagation();
     // ✅ 1. update statut local
  setStatuts(prev => ({ ...prev, [id]: nouveauStatut }));

  // ✅ 2. update ticketsData (IMPORTANT)
  setTicketsData(prev =>
  prev.map(t =>
    t.id === id
      ? {
          ...t,
          statut: nouveauStatut,
          closedAt:
            ["Fermé", "Résolu", "Rejeté"].includes(nouveauStatut)
              ? new Date().toISOString()
              : null,
        }
      : t
  )
);
   try {
      await fetch(`http://localhost:3001/api/tech/tickets/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ 
  status: statusEN[nouveauStatut],
  technicianId: user.id   // ✅ ADD THIS LINE
})
      });
       await fetchTickets();
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
    }
  }

  // Partition actuels / archives
  const { actuelsList, archivesList, archiveYears } = useMemo(() => {
    const actuels = [], archives = [];
    const yearsSet = new Set();
    for (const t of ticketsData) {
      if (isArchived(t)) {
        archives.push(t);
        const y = getArchiveYear(t);
        if (y) yearsSet.add(y);
      } else {
        actuels.push(t);
      }
    }
    return { actuelsList: actuels, archivesList: archives, archiveYears: [...yearsSet].sort((a, b) => b - a) };
  }, [ticketsData]);

  // Filter
  const filterList = useCallback((list, withYear = false) => {
    const q = search.toLowerCase();
    return list.filter(t => {
      const matchSearch =
        !search ||
        String(t.id).includes(q) ||
        t.titre?.toLowerCase().includes(q) ||
        fmtDate(t.createdAt).includes(q);
      return (
        matchSearch &&
        (!filterStatut    || statuts[t.id] === filterStatut) &&
        (!filterPriorite  || t.priorite    === filterPriorite) &&
        (!filterCategorie || t.categorie   === filterCategorie) &&
        (!withYear || !filterYear || getArchiveYear(t) === parseInt(filterYear))
      );
    });
  }, [search, filterStatut, filterPriorite, filterCategorie, filterYear, statuts]);

  const filteredActuels  = useMemo(() => filterList(actuelsList, false), [filterList, actuelsList]);
  const filteredArchives = useMemo(() => filterList(archivesList, true),  [filterList, archivesList]);
  const filtered = activeTab === "actuels" ? filteredActuels : filteredArchives;
  const sortedTickets = useMemo(() => {
  return [...filtered].sort((a, b) => {
    const dateA = new Date(
      activeTab === "archives" ? (a.closedAt || a.createdAt) : (a.assignedAt || a.createdAt)
    ).getTime();

    const dateB = new Date(
      activeTab === "archives" ? (b.closedAt || b.createdAt) : (b.assignedAt || b.createdAt)
    ).getTime();

    return dateB - dateA; // 👈 DESC (récent → ancien)
  });
}, [filtered, activeTab]);
  const sourceList = activeTab === "actuels" ? actuelsList : archivesList;

  // Stats (on actuelsList only)
  const counts = useMemo(() => Object.fromEntries(
    STAT_CARDS.filter(c => c.key).map(c => [c.key, actuelsList.filter(t => statuts[t.id] === c.key).length])
  ), [actuelsList, statuts]);

 const slaDepasses = useMemo(() =>
  actuelsList.filter(t => {
    const TERMINAL = ["Résolu", "Fermé", "Rejeté"];
    if (TERMINAL.includes(statuts[t.id] ?? t.statut)) return false;
    return t.slaDueDate && new Date(t.slaDueDate) < new Date();
  }),
[actuelsList, statuts]);

  const resetFilters = () => { setSearch(""); setFilterStatut(""); setFilterPriorite(""); setFilterCategorie(""); setFilterYear(""); };
  const hasFilters = search || filterStatut || filterPriorite || filterCategorie || filterYear;

  if (loading) return (
    <div className="p-6 flex items-center gap-2 text-gray-500 text-sm">
      <span className="animate-spin">↻</span> Chargement…
    </div>
  );
  if (error) return (
    <div className="p-6 text-red-600 text-sm bg-red-50 rounded-xl border border-red-200">{error}</div>
  );

  return (
    <div className="p-6">

      {/* Header */}
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
          <p className="text-red-700 text-sm font-medium">{slaDepasses.length} ticket(s) ont dépassé le délai SLA</p>
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

      {/* Stats cards (actuelsList only) */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
        {STAT_CARDS.map(({ label, key, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
            <p className="text-xs text-gray-400 mb-1 truncate">{label}</p>
            <p className={`text-2xl font-semibold ${cls}`}>
              {key === null ? actuelsList.length : (counts[key] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <TabSwitch
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); if (tab !== "archives") setFilterYear(""); }}
        actuelCount={actuelsList.length}
        archiveCount={archivesList.length}
      />

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-2 items-end">
        <input
          type="text"
          placeholder="Recherche par ID, titre ou date…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {enumStatuts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={filterPriorite} onChange={e => setFilterPriorite(e.target.value)}>
          <option value="">Toutes les priorités</option>
          {enumPriorites.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)}>
          <option value="">Toutes les catégories</option>
          {enumCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Filtre année — archives seulement */}
        {activeTab === "archives" && archiveYears.length > 0 && (
          <div className="relative">
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none pr-7"
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
            >
              <option value="">Toutes les années</option>
              {archiveYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <HiOutlineChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}

        <button
          className={`border px-3 py-2 rounded-lg text-sm transition ${hasFilters ? "text-red-500 border-red-200 hover:bg-red-50" : "text-gray-400 border-gray-200"}`}
          onClick={resetFilters}
        >
          Réinitialiser
        </button>

        <div className="ml-auto flex items-end pb-0.5">
          <RefreshButton onRefresh={fetchTickets} />
        </div>
      </div>

      {/* Compteur */}
      <p className="text-xs text-gray-400 mb-2">
        <span className="font-semibold text-gray-700">{filtered.length}</span> ticket(s) affiché(s)
        {filtered.length !== sourceList.length && <> sur {sourceList.length}</>}
      </p>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 1000 }}>
            <thead className="bg-gray-50 text-gray-500">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Titre</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                 <th className="px-4 py-3 font-medium">Priorité</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">SLA </th>
                <th className="px-4 py-3 font-medium">Employé</th>
                <th className="px-4 py-3 font-medium">Créé le</th>
                <th className="px-4 py-3 font-medium">
                  {activeTab === "archives" ? "Date clôture" : "Assigné le"}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTickets.map(t => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/technician/ticket-technicien/${t.id}`)}
                  className="border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">#{t.id}</td>

                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px]">
                    <span className="block truncate">{t.titre}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categorieStyle[t.categorie] ?? "bg-gray-100 text-gray-600"}`}>
                      {t.categorie ?? "N/A"}
                    </span>
                  </td>
  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${prioriteStyle[t.priorite] ?? "bg-gray-100 text-gray-600"}`}>
                      {t.priorite ?? "N/A"}
                    </span>
                  </td>

                  {/* Statut — stop propagation */}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <select
                      value={statuts[t.id] ?? ""}
                      onChange={e => changerStatut(e, t.id, e.target.value)}
                      className={`border-none rounded-full px-2 py-1 text-xs font-medium cursor-pointer focus:outline-none ${statutStyle[statuts[t.id]] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {Object.keys(statusEN).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                   <td className="px-4 py-3">
                    {activeTab === "archives"
                      ? <span className="text-gray-300 text-xs">—</span>
                      :<SlaBar
  slaDueDate={t.slaDueDate}
  statut={statuts[t.id] ?? t.statut}
  closedAt={t.closedAt}
  slaPauseElapsed={t.slaPauseElapsed}
/>}
                  </td>

                  <td className="px-4 py-3 text-gray-600 text-xs">{t.employe || "N/A"}</td>

                

                 
                  <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(t.createdAt)}</td>

                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {activeTab === "archives" ? fmtDate(t.closedAt) : fmtDate(t.assignedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Aucun ticket trouvé
          </div>
        )}
      </div>
    </div>
  );
}