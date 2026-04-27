import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RefreshButton from "../../../components/common/RefreshButton";
import {
  HiOutlineTicket, HiOutlineArchiveBox, HiOutlineChevronDown,
} from "react-icons/hi2";

// ── Constants ─────────────────────────────────────
const THIS_YEAR = new Date().getFullYear();

const statutStyle = {
  "Ouvert":                 "bg-blue-100 text-blue-700",
  "En cours":               "bg-violet-100 text-violet-700",
  "En attente":             "bg-yellow-100 text-yellow-700",
  "En attente fournisseur": "bg-orange-100 text-orange-700",
  "Résolu":                 "bg-green-100 text-green-700",
  "Fermé":                  "bg-gray-100 text-gray-500",
  "Rejeté":                 "bg-red-100 text-red-600",
};

const prioriteStyle = {
  "Haute":   "bg-orange-100 text-orange-600",
  "Normale": "bg-yellow-100 text-yellow-600",
  "Basse":   "bg-green-100 text-green-700",
};

const categorieStyle = {
  "Hardware":                  "bg-blue-100 text-blue-700",
  "Logiciels":                 "bg-violet-100 text-violet-700",
  "Réseau":                    "bg-teal-100 text-teal-700",
  "Sécurité":                  "bg-orange-100 text-orange-700",
  "Accès":                     "bg-indigo-100 text-indigo-700",
  "Collaboration & Messagerie":"bg-pink-100 text-pink-700",
};

// DB key ↔ French display label maps — used for API mapping only, NOT for display
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

const priorityFR = { low: "Basse", medium: "Normale", high: "Haute" };
const categoryFR = { hardware: "Hardware", software: "Logiciels", network: "Réseau", access: "Accès", security: "Sécurité", messagerie: "Collaboration & Messagerie" };

// ── Helpers ───────────────────────────────────────
const fmtDate = (str) => {
  if (!str) return "N/A";
  const d = new Date(str);
  if (isNaN(d)) return "N/A";
  return d.toLocaleDateString(undefined, {
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
function SlaBar({ slaDueDate, statut, closedAt, slaPauseElapsed, t }) {
  if (!slaDueDate) return <span className="text-gray-400 text-xs">{t("ticketsService.sla.na")}</span>;

  const PAUSED   = ["En attente", "En attente fournisseur"];
  const TERMINAL = ["Résolu", "Fermé", "Rejeté"];
  const now      = Date.now();
  const due      = new Date(slaDueDate).getTime();
  const debut    = due - 24 * 3600 * 1000;
  const window   = due - debut;

  // ── Terminal ──
  if (TERMINAL.includes(statut)) {
    const closed   = closedAt ? new Date(closedAt).getTime() : due;
    const exceeded = closed > due;
    const used     = Math.min(window, window - (due - closed));
    const pct      = Math.round(Math.min(100, Math.max(0, (used / window) * 100)));
    const delta    = Math.abs(closed - due);
    const h = Math.floor(delta / 3600000), m = Math.floor((delta % 3600000) / 60000);
    return (
      <div className="flex flex-col gap-1 min-w-[140px]">
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-1.5 rounded-full ${exceeded ? "bg-red-400" : "bg-green-400"}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${exceeded ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-500"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${exceeded ? "bg-red-400" : "bg-gray-400"}`} />
          {exceeded
            ? t("ticketsService.sla.exceeded", { h, m })
            : t("ticketsService.sla.closed")}
        </span>
      </div>
    );
  }

  // ── Paused ──
  if (PAUSED.includes(statut)) {
    const frozen = slaPauseElapsed != null ? window - slaPauseElapsed : Math.max(0, due - now);
    const pct    = Math.round(Math.min(100, Math.max(0, ((window - frozen) / window) * 100)));
    const h = Math.floor(frozen / 3600000), m = Math.floor((frozen % 3600000) / 60000);
    return (
      <div className="flex flex-col gap-1 min-w-[140px]">
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-1.5 rounded-full bg-purple-400" style={{ width: `${pct}%` }} />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          {t("ticketsService.sla.frozen", { h, m })}
        </span>
      </div>
    );
  }

  // ── Active ──
  const remaining = due - now;
  const exceeded  = remaining <= 0;
  const pct       = Math.round(Math.min(100, Math.max(0, ((window - Math.max(0, remaining)) / window) * 100)));
  const abs       = Math.abs(remaining);
  const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
  const barCls    = exceeded ? "bg-red-500" : pct > 75 ? "bg-orange-400" : pct > 40 ? "bg-yellow-400" : "bg-green-400";
  const badge     = exceeded
    ? { bg: "bg-red-50 text-red-700",       dot: "bg-red-500 animate-pulse",    label: t("ticketsService.sla.alert", { h, m }) }
    : pct > 75
    ? { bg: "bg-orange-50 text-orange-700", dot: "bg-orange-400 animate-pulse", label: t("ticketsService.sla.remaining", { h, m }) }
    : { bg: "bg-green-50 text-green-700",   dot: "bg-green-500",                label: t("ticketsService.sla.remaining", { h, m }) };

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
const TabSwitch = memo(({ activeTab, setActiveTab, actuelCount, archiveCount, t }) => {
  const tabs = [
    { key: "actuels",  label: t("ticketsService.tabs.current"),                       Icon: HiOutlineTicket,    count: actuelCount  },
    { key: "archives", label: t("ticketsService.tabs.archives", { year: THIS_YEAR }), Icon: HiOutlineArchiveBox, count: archiveCount },
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
  const { t } = useTranslation("technicien");
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

  // ── Stat cards — labels translated via i18n ────────────────────────────────
  // The `key` field stays in French (DB internal values) — only `label` is translated.
  const STAT_CARDS = useMemo(() => [
    { label: t("ticketsService.stats.total"),           key: null,                      cls: "text-gray-700"   },
    { label: t("ticketsService.stats.open"),            key: "Ouvert",                  cls: "text-blue-600"   },
    { label: t("ticketsService.stats.inProgress"),      key: "En cours",                cls: "text-yellow-600" },
    { label: t("ticketsService.stats.pending"),         key: "En attente",              cls: "text-purple-600" },
    { label: t("ticketsService.stats.pendingSupplier"), key: "En attente fournisseur",  cls: "text-orange-600" },
    { label: t("ticketsService.stats.resolved"),        key: "Résolu",                  cls: "text-green-600"  },
    { label: t("ticketsService.stats.closed"),          key: "Fermé",                   cls: "text-gray-500"   },
    { label: t("ticketsService.stats.rejected"),        key: "Rejeté",                  cls: "text-red-600"    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t]);

  // ── Fetch enums ────────────────────────────────────────────────────────────
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

  // ── Fetch tickets ──────────────────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:3001/api/tech/assigned/${user.id}`);
      if (!res.ok) throw new Error("Erreur fetch");
      const data = await res.json();
      const mapped = data.map(tk => ({
        id:              tk.id,
        titre:           tk.title,
        employe:         tk.employee_name,
        priorite:        priorityFR[tk.priority]  ?? tk.priority,
        categorie:       categoryFR[tk.category]  ?? tk.category,
        statut:          statusFR[tk.status]       ?? tk.status,
        createdAt:       tk.created_at,
        assignedAt:      tk.assigned_at,
        closedAt:        tk.closed_at,
        slaDueDate:      tk.sla_date_limite,
        slaStatut:       tk.sla_statut,
        slaPauseElapsed: tk.sla_pause_elapsed_ms ?? null,
      }));
      setTicketsData(mapped);
      setStatuts(Object.fromEntries(mapped.map(tk => [tk.id, tk.statut])));
    } catch (err) {
      setError(t("ticketsService.loading"));
    } finally {
      setLoading(false);
    }
  }, [user.id, t]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // ── Change status ──────────────────────────────────────────────────────────
  async function changerStatut(e, id, nouveauStatut) {
    e.stopPropagation();
    setStatuts(prev => ({ ...prev, [id]: nouveauStatut }));
    setTicketsData(prev =>
      prev.map(tk =>
        tk.id === id
          ? {
              ...tk,
              statut: nouveauStatut,
              closedAt:
                ["Fermé", "Résolu", "Rejeté"].includes(nouveauStatut)
                  ? new Date().toISOString()
                  : null,
            }
          : tk
      )
    );
    try {
      await fetch(`http://localhost:3001/api/tech/tickets/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusEN[nouveauStatut],
          technicianId: user.id,
        }),
      });
      await fetchTickets();
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
    }
  }

  // ── Partition actuels / archives ───────────────────────────────────────────
  const { actuelsList, archivesList, archiveYears } = useMemo(() => {
    const actuels = [], archives = [];
    const yearsSet = new Set();
    for (const tk of ticketsData) {
      if (isArchived(tk)) {
        archives.push(tk);
        const y = getArchiveYear(tk);
        if (y) yearsSet.add(y);
      } else {
        actuels.push(tk);
      }
    }
    return { actuelsList: actuels, archivesList: archives, archiveYears: [...yearsSet].sort((a, b) => b - a) };
  }, [ticketsData]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filterList = useCallback((list, withYear = false) => {
    const q = search.toLowerCase();
    return list.filter(tk => {
      const matchSearch =
        !search ||
        String(tk.id).includes(q) ||
        tk.titre?.toLowerCase().includes(q) ||
        fmtDate(tk.createdAt).includes(q);
      return (
        matchSearch &&
        (!filterStatut    || statuts[tk.id] === filterStatut) &&
        (!filterPriorite  || tk.priorite    === filterPriorite) &&
        (!filterCategorie || tk.categorie   === filterCategorie) &&
        (!withYear || !filterYear || getArchiveYear(tk) === parseInt(filterYear))
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
      return dateB - dateA;
    });
  }, [filtered, activeTab]);

  const sourceList = activeTab === "actuels" ? actuelsList : archivesList;

  // ── Stats (on actuelsList only) ────────────────────────────────────────────
  const counts = useMemo(() => Object.fromEntries(
    STAT_CARDS.filter(c => c.key).map(c => [c.key, actuelsList.filter(tk => statuts[tk.id] === c.key).length])
  ), [STAT_CARDS, actuelsList, statuts]);

  const slaDepasses = useMemo(() =>
    actuelsList.filter(tk => {
      const TERMINAL = ["Résolu", "Fermé", "Rejeté"];
      if (TERMINAL.includes(statuts[tk.id] ?? tk.statut)) return false;
      return tk.slaDueDate && new Date(tk.slaDueDate) < new Date();
    }),
  [actuelsList, statuts]);

  const resetFilters = () => { setSearch(""); setFilterStatut(""); setFilterPriorite(""); setFilterCategorie(""); setFilterYear(""); };
  const hasFilters = search || filterStatut || filterPriorite || filterCategorie || filterYear;

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loading) return (
    <div className="p-6 flex items-center gap-2 text-gray-500 text-sm">
      <span className="animate-spin">↻</span> {t("ticketsService.loading")}
    </div>
  );
  if (error) return (
    <div className="p-6 text-red-600 text-sm bg-red-50 rounded-xl border border-red-200">{error}</div>
  );

  return (
    <div className="p-6">

      {/* ── Header ── */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-800">
          {t("ticketsService.header.subtitle")}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {t("ticketsService.header.subtitleManager")}
        </p>
      </div>

      {/* ── SLA Alert banner ── */}
      {slaDepasses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          <p className="text-red-700 text-sm font-medium">
            {t("ticketsService.sla.alertBanner", { count: slaDepasses.length })}
          </p>
          <div className="ml-auto flex gap-2 flex-wrap">
            {slaDepasses.map(tk => (
              <span
                key={tk.id}
                onClick={() => navigate(`/technician/ticket-technicien/${tk.id}`)}
                className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium cursor-pointer hover:bg-red-200 transition"
              >
                #{tk.id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats cards ── */}
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

      {/* ── Tabs ── */}
      <TabSwitch
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); if (tab !== "archives") setFilterYear(""); }}
        actuelCount={actuelsList.length}
        archiveCount={archivesList.length}
        t={t}
      />

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-2 items-end">
        <input
          type="text"
          placeholder={t("ticketsService.filters.searchPlaceholder")}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
        >
          <option value="">{t("ticketsService.filters.statusAll")}</option>
          {enumStatuts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          value={filterPriorite}
          onChange={e => setFilterPriorite(e.target.value)}
        >
          <option value="">{t("ticketsService.filters.priorityAll")}</option>
          {enumPriorites.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          value={filterCategorie}
          onChange={e => setFilterCategorie(e.target.value)}
        >
          <option value="">{t("ticketsService.filters.categoryAll")}</option>
          {enumCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Archive year filter */}
        {activeTab === "archives" && archiveYears.length > 0 && (
          <div className="relative">
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none pr-7"
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
            >
              <option value="">{t("ticketsService.filters.closeYearAll")}</option>
              {archiveYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <HiOutlineChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}

        <button
          className={`border px-3 py-2 rounded-lg text-sm transition ${hasFilters ? "text-red-500 border-red-200 hover:bg-red-50" : "text-gray-400 border-gray-200"}`}
          onClick={resetFilters}
        >
          {t("ticketsService.filters.reset")}
        </button>

        <div className="ml-auto flex items-end pb-0.5">
          <RefreshButton onRefresh={fetchTickets} />
        </div>
      </div>

      {/* ── Counter ── */}
      <p className="text-xs text-gray-400 mb-2">
        <span className="font-semibold text-gray-700">{filtered.length}</span>{" "}
        {t("ticketsService.filters.countSuffix_other", { count: filtered.length })}
        {filtered.length !== sourceList.length && (
          <> {t("ticketsService.filters.outOf", { total: sourceList.length })}</>
        )}
      </p>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 1000 }}>
            <thead className="bg-gray-50 text-gray-500">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">{t("ticketsService.table.id")}</th>
                <th className="px-4 py-3 font-medium">{t("ticketsService.table.title")}</th>
                <th className="px-4 py-3 font-medium">{t("ticketsService.table.category")}</th>
                <th className="px-4 py-3 font-medium">{t("ticketsService.table.priority")}</th>
                <th className="px-4 py-3 font-medium">{t("ticketsService.table.status")}</th>
                <th className="px-4 py-3 font-medium">{t("ticketsService.table.sla")}</th>
                <th className="px-4 py-3 font-medium">{t("ticketsService.table.employee")}</th>
                <th className="px-4 py-3 font-medium">{t("ticketsService.table.createdAt")}</th>
                <th className="px-4 py-3 font-medium">
                  {activeTab === "archives"
                    ? t("ticketsService.table.closedAt")
                    : t("ticketsService.table.assignedAt")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTickets.map(tk => (
                <tr
                  key={tk.id}
                  onClick={() => navigate(`/technician/ticket-technicien/${tk.id}`)}
                  className="border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">#{tk.id}</td>

                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px]">
                    <span className="block truncate">{tk.titre}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categorieStyle[tk.categorie] ?? "bg-gray-100 text-gray-600"}`}>
                      {tk.categorie ?? "N/A"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${prioriteStyle[tk.priorite] ?? "bg-gray-100 text-gray-600"}`}>
                      {tk.priorite ?? "N/A"}
                    </span>
                  </td>

                  {/* Status dropdown — stopPropagation keeps row click from firing */}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <select
                      value={statuts[tk.id] ?? ""}
                      onChange={e => changerStatut(e, tk.id, e.target.value)}
                      className={`border-none rounded-full px-2 py-1 text-xs font-medium cursor-pointer focus:outline-none ${statutStyle[statuts[tk.id]] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {Object.keys(statusEN).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    {activeTab === "archives"
                      ? <span className="text-gray-300 text-xs">—</span>
                      : <SlaBar
                          slaDueDate={tk.slaDueDate}
                          statut={statuts[tk.id] ?? tk.statut}
                          closedAt={tk.closedAt}
                          slaPauseElapsed={tk.slaPauseElapsed}
                          t={t}
                        />}
                  </td>

                  <td className="px-4 py-3 text-gray-600 text-xs">{tk.employe || "N/A"}</td>

                  <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(tk.createdAt)}</td>

                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {activeTab === "archives" ? fmtDate(tk.closedAt) : fmtDate(tk.assignedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            {t("ticketsService.empty")}
          </div>
        )}
      </div>
    </div>
  );
}