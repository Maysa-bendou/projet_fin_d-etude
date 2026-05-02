import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  "Hardware":   "bg-blue-100 text-blue-700",
  "Logiciels":  "bg-violet-100 text-violet-700",
  "Réseau":     "bg-teal-100 text-teal-700",
  "Sécurité":   "bg-orange-100 text-orange-700",
  "Accès":      "bg-indigo-100 text-indigo-700",
  "Messagerie": "bg-pink-100 text-pink-700",
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

const priorityFR  = { low: "Basse", medium: "Normale", high: "Haute" };
const categoryFR  = { hardware: "Hardware", software: "Logiciels", network: "Réseau", access: "Accès", security: "Sécurité", messagerie: "Messagerie" };

// STAT_CARDS icons stay the same; labels are translated in the component via useMemo
const STAT_CARD_DEFS = [
  { key: null,                     cls: "#374151", Icon: HiOutlineTicket             },
  { key: "Ouvert",                 cls: "#1d4ed8", Icon: HiOutlineShieldExclamation  },
  { key: "En cours",               cls: "#7c3aed", Icon: HiOutlineClock              },
  { key: "En attente",             cls: "#a16207", Icon: HiOutlinePauseCircle        },
  { key: "En attente fournisseur", cls: "#c2410c", Icon: HiOutlinePauseCircle        },
  { key: "Résolu",                 cls: "#15803d", Icon: HiOutlineCheckCircle        },
  { key: "Fermé",                  cls: "#6b7280", Icon: HiOutlineArchiveBoxArrowDown },
  { key: "Rejeté",                 cls: "#dc2626", Icon: HiOutlineXCircle            },
];

const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const getCreatedMonth = (t) => t.createdAt ? new Date(t.createdAt).getMonth() : null;

// ── Helpers ───────────────────────────────────────
// fmtDate is now a hook-friendly function — called inside the component with locale
const makeFmtDate = (locale) => (str) => {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString(locale, { month: "short" })} ${d.getFullYear()}`;
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

// ── SLA Bar (design doc1) ─────────────────────────
function SlaBar({ slaDueDate, statut, closedAt, slaPauseElapsed, t }) {
  if (!slaDueDate) return (
    <span style={{ color: "#94a3b8", fontSize: 11, fontStyle: "italic" }}>
      {t("ticketsService.sla.na")}
    </span>
  );

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
          {exceeded
            ? t("ticketsService.sla.exceeded", { h, m })
            : t("ticketsService.sla.closed")}
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
          {t("ticketsService.sla.frozen", { h, m })}
        </span>
      </div>
    );
  }

  const diffMs   = due - now;
  const exceeded = diffMs <= 0;
  const pct      = Math.max(0, Math.min(100, ((win - Math.max(0, diffMs)) / win) * 100));
  const abs      = Math.abs(diffMs);
  const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
  const barColor   = exceeded ? "#ef4444" : pct > 75 ? "#f87171" : pct > 40 ? "#fbbf24" : "#34d399";
  const labelColor = exceeded ? "#ef4444" : pct > 75 ? "#c2410c" : pct > 40 ? "#a16207" : "#15803d";
  const labelText  = exceeded
    ? t("ticketsService.sla.alert", { h, m })
    : t("ticketsService.sla.remaining", { h, m });

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

// ── Avatar (design doc1) ──────────────────────────
const Avatar = ({ name, color = "#dbeafe", textColor = "#1d4ed8" }) => (
  <div style={{ width: 22, height: 22, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <span style={{ fontSize: 8, fontWeight: 900, color: textColor }}>
      {(name?.[0] || "").toUpperCase()}
    </span>
  </div>
);

// ── TabSwitch (design doc1 + i18n labels) ─────────
const TabSwitch = memo(({ activeTab, setActiveTab, actuelCount, archiveCount, t }) => {
  const tabs = [
    { key: "actuels",  label: t("ticketsService.tabs.current"),                       Icon: HiOutlineTicket,     count: actuelCount  },
    { key: "archives", label: t("ticketsService.tabs.archives", { year: THIS_YEAR }), Icon: HiOutlineArchiveBox, count: archiveCount },
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

// ── Filter primitives (design doc1) ──────────────
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
  const { t, i18n } = useTranslation(["technicien", "common"]);
  const currentLang = i18n.language; // triggers re-render on language switch

  // FIX: locale-aware date formatter
  const dateLocale = t("date.locale", { ns: "common" });
  const fmtDate = makeFmtDate(dateLocale);

  // FIX: translate DB key → display label using common namespace
  // Internal state still uses French keys (statusFR values) for filter/SLA logic — unchanged
  // These helpers are ONLY for display in the table cells and filter dropdowns
  const tStatus = (frLabel) => {
    const dbKey = statusEN[frLabel];
    if (!dbKey) return frLabel;
    return t(`status.${dbKey}`, { ns: "common", defaultValue: frLabel });
  };
  const tPriority = (frLabel) => {
    const map = { "Basse": "low", "Normale": "medium", "Haute": "high" };
    const key = map[frLabel];
    if (!key) return frLabel;
    return t(`priority.${key}`, { ns: "common", defaultValue: frLabel });
  };
  const tCategory = (frLabel) => {
    const map = {
      "Hardware": "hardware", "Logiciels": "software", "Réseau": "network",
      "Accès": "access", "Sécurité": "security", "Messagerie": "messagerie",
    };
    const key = map[frLabel];
    if (!key) return frLabel;
    return t(`category.${key}`, { ns: "common", defaultValue: frLabel });
  };

  // FIX: month names for filter dropdown — language-aware
  const MONTHS_LOCALIZED = Array.from({ length: 12 }, (_, i) =>
    new Date(2024, i, 1).toLocaleString(dateLocale, { month: "short" })
  );
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

  // STAT_CARDS: icons/colors from doc1 + translated labels from doc2
  const STAT_CARDS = useMemo(() => [
    { label: t("ticketsService.stats.total"),           ...STAT_CARD_DEFS[0] },
    { label: t("ticketsService.stats.open"),            ...STAT_CARD_DEFS[1] },
    { label: t("ticketsService.stats.inProgress"),      ...STAT_CARD_DEFS[2] },
    { label: t("ticketsService.stats.pending"),         ...STAT_CARD_DEFS[3] },
    { label: t("ticketsService.stats.pendingSupplier"), ...STAT_CARD_DEFS[4] },
    { label: t("ticketsService.stats.resolved"),        ...STAT_CARD_DEFS[5] },
    { label: t("ticketsService.stats.closed"),          ...STAT_CARD_DEFS[6] },
    { label: t("ticketsService.stats.rejected"),        ...STAT_CARD_DEFS[7] },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t]);

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
      const mapped = data.map(tk => ({
        id:               tk.id,
        titre:            tk.title,
        employe:          tk.employee_name,
        priorite:         priorityFR[tk.priority]  ?? tk.priority,
        categorie:        categoryFR[tk.category]  ?? tk.category,
        statut:           statusFR[tk.status]       ?? tk.status,
        createdAt:        tk.created_at,
        assignedAt:       tk.assigned_at,
        closedAt:         tk.closed_at,
        slaDueDate:       tk.sla_date_limite,
        slaStatut:        tk.sla_statut,
        slaPauseElapsed:  tk.sla_pause_elapsed_ms ?? null,
      }));
      setTicketsData(mapped);
      setStatuts(Object.fromEntries(mapped.map(tk => [tk.id, tk.statut])));
    } catch {
      setError(t("ticketsService.loading"));
    } finally {
      setLoading(false);
    }
  }, [user.id, t]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  async function changerStatut(e, id, nouveauStatut) {
    e.stopPropagation();
    setStatuts(prev => ({ ...prev, [id]: nouveauStatut }));
    setTicketsData(prev =>
      prev.map(tk =>
        tk.id === id
          ? {
              ...tk,
              statut: nouveauStatut,
              closedAt: ["Fermé", "Résolu", "Rejeté"].includes(nouveauStatut)
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

  const filterList = useCallback((list, withYear = false) => {
  const q = search.toLowerCase();

  return list.filter(tk => {
    const matchSearch =
      !search ||
      String(tk.id).includes(q) ||
      tk.titre?.toLowerCase().includes(q) ||
      fmtDate(tk.createdAt).includes(q);

    const month = withYear
      ? getMonthFromDate(tk.closedAt || tk.createdAt) // 🔥 FIX HERE
      : getMonthFromDate(tk.createdAt);

    return (
      matchSearch &&
      (!filterStatut    || statuts[tk.id] === filterStatut) &&
      (!filterPriorite  || tk.priorite    === filterPriorite) &&
      (!filterCategorie || tk.categorie   === filterCategorie) &&
      (!filterMonth     || month === parseInt(filterMonth)) &&
      (!withYear || !filterYear || getArchiveYear(tk) === parseInt(filterYear))
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
    STAT_CARDS.filter(c => c.key).map(c => [c.key, actuelsList.filter(tk => statuts[tk.id] === c.key).length])
  ), [STAT_CARDS, actuelsList, statuts]);

  const slaDepasses = useMemo(() =>
    actuelsList.filter(tk => {
      const TERMINAL = ["Résolu", "Fermé", "Rejeté"];
      if (TERMINAL.includes(statuts[tk.id] ?? tk.statut)) return false;
      return tk.slaDueDate && new Date(tk.slaDueDate) < new Date();
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
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 2 }}>
          {t("ticketsService.loading")}
        </span>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ margin: 24, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>
      {error}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#faf9f7", fontFamily: "sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: "1px solid #e8e2d9", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          
          <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:0 }}>
            {t("ticketsService.header.subtitle")}
          </h1>
          <p style={{ fontSize: 14, color: "#53575c", margin: 0, fontWeight: 530 }}>
            {t("ticketsService.header.subtitleManager")}
          </p>
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
              {t("ticketsService.sla.alertBanner", { count: slaDepasses.length })}
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {slaDepasses.map(tk => (
                <span
                  key={tk.id}
                  onClick={() => navigate(`/technician/ticket-technicien/${tk.id}`)}
                  style={{ background: "#fee2e2", color: "#b91c1c", fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 700, cursor: "pointer" }}
                >
                  #{tk.id}
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
          t={t}
        />

        {/* ── Filtres ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, background: "#fff", border: "1px solid #e8e2d9", borderRadius: 10, padding: "7px 12px", overflowX: "auto" }}>

          <FilterInput
            placeholder={t("ticketsService.filters.searchPlaceholder")}
            value={search}
            onChange={setSearch}
          />
          <Sep />
          <FilterSelect icon={HiOutlineTag} value={filterCategorie} onChange={setFilterCategorie} minW={120}>
            <option value="">{t("ticketsService.filters.categoryAll")}</option>
            {enumCategories.map(c => <option key={c} value={c}>{tCategory(c)}</option>)}
          </FilterSelect>
          <FilterSelect icon={HiOutlineExclamationCircle} value={filterStatut} onChange={setFilterStatut} minW={110}>
            <option value="">{t("ticketsService.filters.statusAll")}</option>
            {enumStatuts.map(s => <option key={s} value={s}>{tStatus(s)}</option>)}
          </FilterSelect>
          <FilterSelect icon={HiOutlineFunnel} value={filterPriorite} onChange={setFilterPriorite} minW={110}>
            <option value="">{t("ticketsService.filters.priorityAll")}</option>
            {enumPriorites.map(p => <option key={p} value={p}>{tPriority(p)}</option>)}
          </FilterSelect>

          <FilterSelect icon={HiOutlineCalendarDays} value={filterMonth} onChange={setFilterMonth} minW={90}>
            <option value="">{t("ticketsService.filters.mois")}</option>
            {MONTHS_LOCALIZED.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </FilterSelect>

          {/* Filtre année — archives seulement */}
          {activeTab === "archives" && archiveYears.length > 0 && (
            <FilterSelect icon={HiOutlineCalendarDays} value={filterYear} onChange={setFilterYear} minW={90}>
              <option value="">{t("ticketsService.filters.closeYearAll")}</option>
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
            {t("ticketsService.filters.reset")}
          </button>

          <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>{filtered.length}</span>
            {filtered.length !== sourceList.length && <> / {sourceList.length}</>}{" "}
            {t("ticketsService.filters.countSuffix_other", { count: filtered.length })}
          </span>
        </div>

        {/* ── Tableau ── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e2d9", overflow: "hidden" }}>
          {sortedTickets.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <HiOutlineTicket size={32} color="#d1d5db" style={{ marginBottom: 10 }} />
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                {t("ticketsService.empty")}
              </p>
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
                  <tr style={{ background: "#faf9f7", borderBottom: "1.5px solid #e8e2d9" }}>
                    {[
                      t("ticketsService.table.id"),
                      t("ticketsService.table.title"),
                      t("ticketsService.table.category"),
                      t("ticketsService.table.priority"),
                      t("ticketsService.table.status"),
                      t("ticketsService.table.sla"),
                      t("ticketsService.table.employee"),
                      t("ticketsService.table.createdAt"),
                      activeTab === "archives"
                        ? t("ticketsService.table.closedAt")
                        : t("ticketsService.table.assignedAt"),
                    ].map((h, i) => (
                      <th key={i} style={{ padding: "9px 10px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", textAlign: "left" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTickets.map((tk, idx) => {
                    const statutCurrent = statuts[tk.id] ?? tk.statut;
                    return (
                      <tr
                        key={tk.id}
                        onClick={() => navigate(`/technician/ticket-technicien/${tk.id}`)}
                        style={{ background: "#fff", borderBottom: idx === sortedTickets.length - 1 ? "none" : "1px solid #f4f0ec", cursor: "pointer" }}
                        onMouseOver={e => e.currentTarget.style.background = "#faf8f5"}
                        onMouseOut={e  => e.currentTarget.style.background = "#fff"}
                      >
                        {/* ID */}
                        <td style={{ padding: "9px 10px", fontSize: 11, fontWeight: 700, color: "#c4bfb8" }}>
                          #{tk.id}
                        </td>

                        {/* Titre */}
                        <td style={{ padding: "9px 10px", overflow: "hidden" }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
                            {tk.titre || "N/A"}
                          </span>
                        </td>

                        {/* Catégorie */}
                        <td style={{ padding: "9px 10px" }}>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categorieStyle[tk.categorie] ?? "bg-gray-100 text-gray-600"}`}>
                            {tCategory(tk.categorie) ?? "N/A"}
                          </span>
                        </td>

                        {/* Priorité */}
                        <td style={{ padding: "9px 10px" }}>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioriteStyle[tk.priorite] ?? "bg-gray-100 text-gray-600"}`}>
                            {tPriority(tk.priorite) ?? "N/A"}
                          </span>
                        </td>

                        {/* Statut — select inline */}
                        <td style={{ padding: "9px 10px" }} onClick={e => e.stopPropagation()}>
                          <select
                            value={statutCurrent}
                            onChange={e => changerStatut(e, tk.id, e.target.value)}
                            className={`border-none rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer focus:outline-none ${statutStyle[statutCurrent] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {Object.keys(statusEN).map(s => (
                              <option key={s} value={s}>{tStatus(s)}</option>
                            ))}
                          </select>
                        </td>

                        {/* SLA */}
                        <td style={{ padding: "9px 10px" }}>
                          {activeTab === "archives"
                            ? <span style={{ color: "#d1d5db", fontSize: 11 }}>—</span>
                            : <SlaBar
                                slaDueDate={tk.slaDueDate}
                                statut={statutCurrent}
                                closedAt={tk.closedAt}
                                slaPauseElapsed={tk.slaPauseElapsed}
                                t={t}
                              />
                          }
                        </td>

                        {/* Employé avec avatar */}
                        <td style={{ padding: "9px 10px" }}>
                          {tk.employe ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Avatar name={tk.employe} color="#fce7f3" textColor="#9d174d" />
                              <span style={{ fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {tk.employe}
                              </span>
                            </div>
                          ) : <span style={{ color: "#d1d5db", fontSize: 11 }}>—</span>}
                        </td>

                        {/* Créé le */}
                        <td style={{ padding: "9px 10px", fontSize: 11, color: "#94a3b8" }}>
                          {fmtDate(tk.createdAt)}
                        </td>

                        {/* Assigné le / Date clôture */}
                        <td style={{ padding: "9px 10px", fontSize: 11, color: "#94a3b8" }}>
                          {activeTab === "archives" ? fmtDate(tk.closedAt) : fmtDate(tk.assignedAt)}
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