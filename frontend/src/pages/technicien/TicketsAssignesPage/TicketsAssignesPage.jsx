import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import RefreshButton from "../../../components/common/RefreshButton";
import {
  HiOutlineTicket, HiOutlineArchiveBox,
  HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineArrowPath,
  HiOutlineTag, HiOutlineExclamationCircle, HiOutlineCalendarDays,
  HiOutlineFunnel, HiOutlineClock, HiOutlineCheckCircle,
  HiOutlinePauseCircle, HiOutlineXCircle, HiOutlineArchiveBoxArrowDown,
  HiOutlineShieldExclamation,
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
  "Messagerie":"bg-pink-100 text-pink-700",
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

const priorityFR  = { low: "Basse", medium: "Normale", high: "Haute" };
const categoryFR  = { hardware: "Hardware", software: "Logiciels", network: "Réseau", access: "Accès", security: "Sécurité", messagerie: "Messagerie" };

const STAT_CARDS = [
  { label: "Total",            key: null,                     cls: "#374151", Icon: HiOutlineTicket            },
  { label: "Ouvert",           key: "Ouvert",                 cls: "#1d4ed8", Icon: HiOutlineShieldExclamation },
  { label: "En cours",         key: "En cours",               cls: "#7c3aed", Icon: HiOutlineClock             },
  { label: "En attente",       key: "En attente",             cls: "#a16207", Icon: HiOutlinePauseCircle       },
  { label: "Att. fournisseur", key: "En attente fournisseur", cls: "#c2410c", Icon: HiOutlinePauseCircle       },
  { label: "Résolu",           key: "Résolu",                 cls: "#15803d", Icon: HiOutlineCheckCircle       },
  { label: "Fermé",            key: "Fermé",                  cls: "#6b7280", Icon: HiOutlineArchiveBoxArrowDown},
  { label: "Rejeté",           key: "Rejeté",                 cls: "#dc2626", Icon: HiOutlineXCircle           },
];

const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const getCreatedMonth = (t) => t.createdAt ? new Date(t.createdAt).getMonth() : null;

// ── Helpers ───────────────────────────────────────
const fmtDate = (str) => {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("fr-FR", { month: "short" })} ${d.getFullYear()}`;
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

// ── SLA Bar (même style que TicketsServicePage) ───
function SlaBar({ slaDueDate, statut, closedAt, slaPauseElapsed }) {
  if (!slaDueDate) return <span style={{ color: "#94a3b8", fontSize: 11, fontStyle: "italic" }}>N/A</span>;

  const PAUSED   = ["En attente", "En attente fournisseur"];
  const TERMINAL = ["Résolu", "Fermé", "Rejeté"];
  const now      = Date.now();
  const due      = new Date(slaDueDate).getTime();
  const debut    = due - 24 * 3600 * 1000;
  const win      = due - debut;

  if (TERMINAL.includes(statut)) {
    const closed   = closedAt ? new Date(closedAt).getTime() : due;
    const exceeded = closed > due;
    const delta    = Math.abs(closed - due);
    const used     = exceeded ? win + delta : win - (due - closed);
    const pct      = Math.min(100, Math.max(0, (used / win) * 100));
    const h = Math.floor(delta / 3600000), m = Math.floor((delta % 3600000) / 60000);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ height: 3, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: exceeded ? "#f87171" : "#34d399" }} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap", color: exceeded ? "#ef4444" : "#6b7280" }}>
          {exceeded ? `+${h}h ${m}m` : "clôturé ✓"}
        </span>
      </div>
    );
  }

  if (PAUSED.includes(statut)) {
    const frozen = slaPauseElapsed != null ? win - slaPauseElapsed : Math.max(0, due - now);
    const pct    = Math.min(100, Math.max(0, ((win - frozen) / win) * 100));
    const h = Math.floor(frozen / 3600000), m = Math.floor((frozen % 3600000) / 60000);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ height: 3, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#a78bfa" }} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap", color: "#7c3aed" }}>
          ⏸ {h}h {m}m figé
        </span>
      </div>
    );
  }

  const diffMs   = due - now;
  const exceeded = diffMs <= 0;
  const pct      = Math.max(0, Math.min(100, ((win - Math.max(0, diffMs)) / win) * 100));
  const abs      = Math.abs(diffMs);
  const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
  const barColor = exceeded ? "#ef4444" : pct > 75 ? "#f87171" : pct > 40 ? "#fbbf24" : "#34d399";
  const labelColor = exceeded ? "#ef4444" : pct > 75 ? "#c2410c" : pct > 40 ? "#a16207" : "#15803d";
  const labelText  = exceeded ? `⚠ +${h}h dépassé` : `${h}h ${m}m`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ height: 3, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor }} />
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap", color: labelColor }}>
        {labelText}
      </span>
    </div>
  );
}

// ── Avatar (même que TicketsServicePage) ─────────
const Avatar = ({ name, color = "#dbeafe", textColor = "#1d4ed8" }) => (
  <div style={{ width: 22, height: 22, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <span style={{ fontSize: 8, fontWeight: 900, color: textColor }}>
      {(name?.[0] || "").toUpperCase()}
    </span>
  </div>
);

// ── TabSwitch (style TicketsServicePage) ──────────
const TabSwitch = memo(({ activeTab, setActiveTab, actuelCount, archiveCount }) => {
  const tabs = [
    { key: "actuels",  label: "Tickets actuels",               Icon: HiOutlineTicket,     count: actuelCount  },
    { key: "archives", label: `Archives (avant ${THIS_YEAR})`, Icon: HiOutlineArchiveBox, count: archiveCount },
  ];
  return (
    <div style={{ display: "flex", borderBottom: "1.5px solid #e8e2d9", marginBottom: 16 }}>
      {tabs.map(({ key, label, Icon, count }) => {
        const on = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: on ? 700 : 500,
              color: on ? "#0f172a" : "#94a3b8",
              borderBottom: on ? "2.5px solid #1d4ed8" : "2.5px solid transparent",
              marginBottom: "-1.5px", transition: "all 0.15s",
            }}
          >
            <Icon size={14} style={{ color: on ? "#1d4ed8" : "#c4bfb8" }} />
            {label}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
              background: on ? "#dbeafe" : "#f1f5f9",
              color: on ? "#1d4ed8" : "#94a3b8",
            }}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
});

// ── Filter primitives (style TicketsServicePage) ──
const FilterInput = ({ placeholder, value, onChange }) => (
  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
    <HiOutlineMagnifyingGlass size={13} color="#94a3b8" style={{ position: "absolute", left: 9, pointerEvents: "none" }} />
    <input
      type="text" placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: "0 26px 0 28px", height: 32, width: 180, fontSize: 12, color: "#1e293b", background: "#fff", outline: "none" }}
      onFocus={e => e.target.style.borderColor = "#93c5fd"}
      onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
    />
    {value && (
      <button onClick={() => onChange("")} style={{ position: "absolute", right: 7, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
        <HiOutlineXMark size={12} color="#94a3b8" />
      </button>
    )}
  </div>
);

const FilterSelect = ({ icon: Icon, value, onChange, minW = 115, children }) => (
  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
    {Icon && <Icon size={13} color="#94a3b8" style={{ position: "absolute", left: 9, pointerEvents: "none", zIndex: 1 }} />}
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      border: "1px solid #e2e8f0", borderRadius: 7,
      padding: Icon ? "0 8px 0 28px" : "0 8px",
      height: 32, fontSize: 12, color: value ? "#1e293b" : "#94a3b8",
      background: "#fff", outline: "none", cursor: "pointer", appearance: "none", minWidth: minW,
    }}>
      {children}
    </select>
  </div>
);

const Sep = () => <div style={{ width: 1, height: 20, background: "#e8e2d9", flexShrink: 0 }} />;

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
  const [filterMonth,     setFilterMonth]     = useState("");

  const [enumStatuts,     setEnumStatuts]     = useState([]);
  const [enumPriorites,   setEnumPriorites]   = useState([]);
  const [enumCategories,  setEnumCategories]  = useState([]);

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

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:3001/api/tech/assigned/${user.id}`);
      if (!res.ok) throw new Error("Erreur fetch");
      const data = await res.json();
      const mapped = data.map(t => ({
        id:               t.id,
        titre:            t.title,
        employe:          t.employee_name,
        priorite:         priorityFR[t.priority]  ?? t.priority,
        categorie:        categoryFR[t.category]  ?? t.category,
        statut:           statusFR[t.status]       ?? t.status,
        createdAt:        t.created_at,
        assignedAt:       t.assigned_at,
        closedAt:         t.closed_at,
        slaDueDate:       t.sla_date_limite,
        slaStatut:        t.sla_statut,
        slaPauseElapsed:  t.sla_pause_elapsed_ms ?? null,
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

  async function changerStatut(e, id, nouveauStatut) {
    e.stopPropagation();
    setStatuts(prev => ({ ...prev, [id]: nouveauStatut }));
    setTicketsData(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              statut: nouveauStatut,
              closedAt: ["Fermé", "Résolu", "Rejeté"].includes(nouveauStatut)
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
        body: JSON.stringify({ status: statusEN[nouveauStatut], technicianId: user.id }),
      });
      await fetchTickets();
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
    }
  }

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

  const filterList = useCallback((list, withYear = false) => {
    const q = search.toLowerCase();
    return list.filter(t => {
      const matchSearch =
        !search ||
        String(t.id).includes(q) ||
        t.titre?.toLowerCase().includes(q) ||
        fmtDate(t.createdAt).includes(q);
      const month = getCreatedMonth(t);
      return (
        matchSearch &&
        (!filterStatut    || statuts[t.id] === filterStatut) &&
        (!filterPriorite  || t.priorite    === filterPriorite) &&
        (!filterCategorie || t.categorie   === filterCategorie) &&
        (!filterMonth     || month === parseInt(filterMonth)) &&
        (!withYear || !filterYear || getArchiveYear(t) === parseInt(filterYear))
      );
    });
  }, [search, filterStatut, filterPriorite, filterCategorie, filterYear, filterMonth, statuts]);

  const filteredActuels  = useMemo(() => filterList(actuelsList, false), [filterList, actuelsList]);
  const filteredArchives = useMemo(() => filterList(archivesList, true),  [filterList, archivesList]);
  const filtered = activeTab === "actuels" ? filteredActuels : filteredArchives;

  const sortedTickets = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const dateA = new Date(activeTab === "archives" ? (a.closedAt || a.createdAt) : (a.assignedAt || a.createdAt)).getTime();
      const dateB = new Date(activeTab === "archives" ? (b.closedAt || b.createdAt) : (b.assignedAt || b.createdAt)).getTime();
      return dateB - dateA;
    });
  }, [filtered, activeTab]);

  const sourceList = activeTab === "actuels" ? actuelsList : archivesList;

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

  const resetFilters = () => { setSearch(""); setFilterStatut(""); setFilterPriorite(""); setFilterCategorie(""); setFilterYear(""); setFilterMonth(""); };
  const hasFilters = search || filterStatut || filterPriorite || filterCategorie || filterYear || filterMonth;

  // ── Loading / Error ──
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f9f6f2" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 28, height: 28, border: "2px solid #d9d4cc", borderTopColor: "#374151", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 2 }}>Chargement…</span>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ margin: 24, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>{error}</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f9f6f2", fontFamily: "sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ background: "#f9f6f2", borderBottom: "1px solid #e8e2d9", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 2px" }}>
            Technicien
          </p>
          <h1 style={{ fontSize: 19, fontWeight: 900, color: "#0f172a", margin: 0 }}>
            Mes tickets <span style={{ color: "#1d4ed8" }}>assignés</span>
          </h1>
        </div>
        <RefreshButton onRefresh={fetchTickets} />
      </div>

      <div style={{ padding: "20px 28px" }}>

        {/* ── Alerte SLA ── */}
        {slaDepasses.length > 0 && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#b91c1c" }}>
              {slaDepasses.length} ticket(s) ont dépassé le délai SLA
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {slaDepasses.map(t => (
                <span
                  key={t.id}
                  onClick={() => navigate(`/technician/ticket-technicien/${t.id}`)}
                  style={{ background: "#fee2e2", color: "#b91c1c", fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 700, cursor: "pointer" }}
                >
                  #{t.id}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8, marginBottom: 20 }}>
          {STAT_CARDS.map(({ label, key, cls, Icon }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e2d9", padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {label}
                </p>
                <Icon size={13} color={cls} style={{ flexShrink: 0, opacity: 0.7 }} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 900, color: cls, margin: 0, lineHeight: 1 }}>
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
        />

        {/* ── Filtres (style TicketsServicePage) ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, background: "#fff", border: "1px solid #e8e2d9", borderRadius: 10, padding: "7px 12px", overflowX: "auto" }}>

          <FilterInput
            placeholder="Rechercher ID, titre…"
            value={search}
            onChange={setSearch}
          />
          <Sep />
          <FilterSelect icon={HiOutlineTag} value={filterCategorie} onChange={setFilterCategorie} minW={120}>
            <option value="">Catégorie</option>
            {enumCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </FilterSelect>
          <FilterSelect icon={HiOutlineExclamationCircle} value={filterStatut} onChange={setFilterStatut} minW={110}>
            <option value="">Statut</option>
            {enumStatuts.map(s => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>
          <FilterSelect icon={HiOutlineFunnel} value={filterPriorite} onChange={setFilterPriorite} minW={110}>
            <option value="">Priorité</option>
            {enumPriorites.map(p => <option key={p} value={p}>{p}</option>)}
          </FilterSelect>

          <FilterSelect icon={HiOutlineCalendarDays} value={filterMonth} onChange={setFilterMonth} minW={90}>
            <option value="">Mois</option>
            {MONTHS_FR.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </FilterSelect>

          {/* Filtre année — archives seulement */}
          {activeTab === "archives" && archiveYears.length > 0 && (
            <FilterSelect icon={HiOutlineCalendarDays} value={filterYear} onChange={setFilterYear} minW={90}>
              <option value="">Année</option>
              {archiveYears.map(y => <option key={y} value={y}>{y}</option>)}
            </FilterSelect>
          )}

          <Sep />
          <button
            onClick={resetFilters}
            style={{
              display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 11px", borderRadius: 7, whiteSpace: "nowrap",
              border: `1px solid ${hasFilters ? "#fca5a5" : "#e2e8f0"}`,
              fontSize: 12, fontWeight: 600,
              color: hasFilters ? "#dc2626" : "#94a3b8",
              background: hasFilters ? "#fef2f2" : "#fff", cursor: "pointer", flexShrink: 0,
            }}
          >
            <HiOutlineArrowPath size={12} />
            Réinitialiser
          </button>

          <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>{filtered.length}</span>
            {filtered.length !== sourceList.length && <> / {sourceList.length}</>} ticket{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Tableau ── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e2d9", overflow: "hidden" }}>
          {sortedTickets.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <HiOutlineTicket size={32} color="#d1d5db" style={{ marginBottom: 10 }} />
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Aucun ticket pour les filtres sélectionnés.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 1050 }}>
                <colgroup>
                  <col style={{ width: 55  }} />
                  <col style={{ width: 170 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 90  }} />
                  <col style={{ width: 145 }} />
                  <col style={{ width: 115 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 105 }} />
                  <col style={{ width: 110 }} />
                </colgroup>
                <thead>
                  <tr style={{ background: "#f9f6f2", borderBottom: "1.5px solid #e8e2d9" }}>
                    {[
                      "ID", "Titre", "Catégorie", "Priorité", "Statut", "SLA",
                      "Employé", "Créé le",
                      activeTab === "archives" ? "Date clôture" : "Assigné le",
                    ].map((h, i) => (
                      <th key={i} style={{ padding: "9px 10px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", textAlign: "left" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTickets.map((t, idx) => {
                    const statutCurrent = statuts[t.id] ?? t.statut;
                    return (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/technician/ticket-technicien/${t.id}`)}
                        style={{ background: "#fff", borderBottom: idx === sortedTickets.length - 1 ? "none" : "1px solid #f4f0ec", cursor: "pointer" }}
                        onMouseOver={e => e.currentTarget.style.background = "#faf8f5"}
                        onMouseOut={e  => e.currentTarget.style.background = "#fff"}
                      >
                        {/* ID */}
                        <td style={{ padding: "9px 10px", fontSize: 11, fontWeight: 700, color: "#c4bfb8" }}>
                          #{t.id}
                        </td>

                        {/* Titre */}
                        <td style={{ padding: "9px 10px", overflow: "hidden" }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
                            {t.titre || "N/A"}
                          </span>
                        </td>

                        {/* Catégorie */}
                        <td style={{ padding: "9px 10px" }}>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categorieStyle[t.categorie] ?? "bg-gray-100 text-gray-600"}`}>
                            {t.categorie ?? "N/A"}
                          </span>
                        </td>

                        {/* Priorité */}
                        <td style={{ padding: "9px 10px" }}>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioriteStyle[t.priorite] ?? "bg-gray-100 text-gray-600"}`}>
                            {t.priorite ?? "N/A"}
                          </span>
                        </td>

                        {/* Statut — select inline, stop propagation */}
                        <td style={{ padding: "9px 10px" }} onClick={e => e.stopPropagation()}>
                          <select
                            value={statutCurrent}
                            onChange={e => changerStatut(e, t.id, e.target.value)}
                            className={`border-none rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer focus:outline-none ${statutStyle[statutCurrent] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {Object.keys(statusEN).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>

                        {/* SLA */}
                        <td style={{ padding: "9px 10px" }}>
                          {activeTab === "archives"
                            ? <span style={{ color: "#d1d5db", fontSize: 11 }}>—</span>
                            : <SlaBar
                                slaDueDate={t.slaDueDate}
                                statut={statutCurrent}
                                closedAt={t.closedAt}
                                slaPauseElapsed={t.slaPauseElapsed}
                              />
                          }
                        </td>

                        {/* Employé avec avatar */}
                        <td style={{ padding: "9px 10px" }}>
                          {t.employe ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Avatar name={t.employe} color="#fce7f3" textColor="#9d174d" />
                              <span style={{ fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {t.employe}
                              </span>
                            </div>
                          ) : <span style={{ color: "#d1d5db", fontSize: 11 }}>—</span>}
                        </td>

                        {/* Créé le */}
                        <td style={{ padding: "9px 10px", fontSize: 11, color: "#94a3b8" }}>
                          {fmtDate(t.createdAt)}
                        </td>

                        {/* Assigné le / Date clôture */}
                        <td style={{ padding: "9px 10px", fontSize: 11, color: "#94a3b8" }}>
                          {activeTab === "archives" ? fmtDate(t.closedAt) : fmtDate(t.assignedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}