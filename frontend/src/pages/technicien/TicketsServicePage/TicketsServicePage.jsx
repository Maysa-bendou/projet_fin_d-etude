import React, {
  useState, useEffect, useMemo, useCallback, memo
} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HiOutlineTicket, HiOutlineArchiveBox, HiOutlineChevronDown,
  HiOutlineArrowPath, HiOutlineFunnel, HiOutlineMagnifyingGlass, HiOutlineXMark,
} from "react-icons/hi2";
import RefreshButton from "../../../components/common/RefreshButton";
// AJOUTER après les imports existants
import { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG } from "../../../config/styles";
import Pill from "../../../components/common/Pill";
// ── Constants (module-level, never re-created) ─────────────────────────────

const THIS_YEAR = new Date().getFullYear();



const LABEL_STYLE = {
  fontSize: 11, fontWeight: 700, color: "#94a3b8",
  textTransform: "uppercase", letterSpacing: "0.5px",
  display: "block", marginBottom: 5,
};

const SELECT_STYLE = {
  border: "1.5px solid #d9d4cc", borderRadius: 8,
  padding: "8px 32px 8px 12px", fontSize: 13, fontWeight: 500,
  color: "#1e293b", background: "#fff", outline: "none",
  appearance: "none", cursor: "pointer", minWidth: 150, height: 38,
};

// ── Pure helpers ───────────────────────────────────────────────────────────

const fmtDate = (str) => {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return `${String(d.getDate()).padStart(2,"0")} ${d.toLocaleString("fr-FR",{month:"short"})} ${d.getFullYear()}`;
};

const getArchiveYear = (t) => t.closed_at ? new Date(t.closed_at).getFullYear() : null;

const isArchived = (t) => {
  if (t.status !== "closed" && t.status !== "rejected") return false;
  const y = getArchiveYear(t);
  return y !== null && y < THIS_YEAR;
};

// ── Debounce hook ──────────────────────────────────────────────────────────

function useDebounce(value, delay = 220) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── SLA Bar ────────────────────────────────────────────────────────────────

const SlaBar = memo(({ slaDueDate, slaDebut, status, closedAt, slaPauseElapsed }) => {
  const { t } = useTranslation("technicien");

  if (!slaDueDate)
    return <span style={{ color: "#94a3b8", fontSize: 11, fontStyle: "italic" }}>N/A</span>;

  const PAUSED   = ["pending", "pending_supplier"];
  const TERMINAL = ["resolved", "closed", "rejected"];
  const now      = Date.now();
  const due      = new Date(slaDueDate).getTime();
  const debut    = slaDebut ? new Date(slaDebut).getTime() : due - 86400000;
  const window   = due - debut;

  // ── Terminal ──
  if (TERMINAL.includes(status)) {
    const closed   = closedAt ? new Date(closedAt).getTime() : due;
    const exceeded = closed > due;
    const delta    = Math.abs(closed - due);
    const used     = exceeded ? window + delta : window - (due - closed);
    const pct      = Math.min(100, Math.max(0, (used / window) * 100));
    const h = Math.floor(delta / 3600000), m = Math.floor((delta % 3600000) / 60000);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 100 }}>
        <div style={{ height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: exceeded ? "#f87171" : "#34d399" }} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap", color: exceeded ? "#ef4444" : "#6b7280" }}>
          {exceeded ? t("ticketsService.sla.exceeded", { h, m }) : t("ticketsService.sla.closed")}
        </span>
      </div>
    );
  }

  // ── Pause ──
  if (PAUSED.includes(status)) {
    const frozen = slaPauseElapsed != null ? window - slaPauseElapsed : Math.max(0, due - now);
    const pct    = Math.min(100, Math.max(0, ((window - frozen) / window) * 100));
    const h = Math.floor(frozen / 3600000), m = Math.floor((frozen % 3600000) / 60000);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 100 }}>
        <div style={{ height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#a78bfa" }} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap", color: "#7c3aed" }}>
          ⏸ {t("ticketsService.sla.frozen", { h, m })}
        </span>
      </div>
    );
  }

  // ── Actif ──
  const diffMs    = due - now;
  const exceeded  = diffMs <= 0;
  const pct       = Math.max(0, Math.min(100, ((window - Math.max(0, diffMs)) / window) * 100));
  const abs       = Math.abs(diffMs);
  const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
  const barColor  = exceeded ? "#ef4444" : h < 2 ? "#f87171" : h < 6 ? "#fbbf24" : "#34d399";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 100 }}>
      <div style={{ height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor }} />
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap", color: exceeded ? "#ef4444" : "#94a3b8" }}>
        {exceeded ? t("ticketsService.sla.alert", { h }) : t("ticketsService.sla.remaining", { h, m })}
      </span>
    </div>
  );
});

// ── FilterSelect ───────────────────────────────────────────────────────────

const FilterSelect = memo(({ label, value, onChange, children }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <span style={LABEL_STYLE}>{label}</span>
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={SELECT_STYLE}>
        {children}
      </select>
      <HiOutlineChevronDown size={13} color="#94a3b8"
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  </div>
));

// ── TabSwitch ──────────────────────────────────────────────────────────────

const TabSwitch = memo(({ activeTab, setActiveTab, actuelCount, archiveCount }) => {
  const { t } = useTranslation("technicien");
  const tabs = [
    { key: "actuels",  label: t("ticketsService.tabs.current"),                        Icon: HiOutlineTicket,    count: actuelCount,  ac: "#1d4ed8", ab: "#eff6ff", abr: "#bfdbfe" },
    { key: "archives", label: t("ticketsService.tabs.archives", { year: THIS_YEAR }),  Icon: HiOutlineArchiveBox, count: archiveCount, ac: "#6b7280", ab: "#f3f4f6", abr: "#d1d5db" },
  ];
  return (
    <div style={{ display: "inline-flex", background: "#ede9e3", borderRadius: 14, padding: 4, gap: 2, marginBottom: 24, border: "1px solid #d9d4cc", boxShadow: "inset 0 1px 4px rgba(0,0,0,0.07)" }}>
      {tabs.map(({ key, label, Icon, count, ac, ab, abr }) => {
        const on = activeTab === key;
        return (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 22px", borderRadius: 10,
            border: on ? `1.5px solid ${abr}` : "1.5px solid transparent",
            background: on ? "#fff" : "transparent", cursor: "pointer",
            fontSize: 13, fontWeight: on ? 700 : 500, color: on ? ac : "#94a3b8",
            transition: "all 0.18s", boxShadow: on ? "0 2px 8px rgba(0,0,0,0.09)" : "none", whiteSpace: "nowrap",
          }}>
            <Icon size={15} style={{ color: on ? ac : "#c4bfb8", flexShrink: 0 }} />
            <span>{label}</span>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: on ? ab : "#e2ddd7", color: on ? ac : "#a8a29e", border: on ? `1px solid ${abr}` : "1px solid transparent", borderRadius: 20, padding: "0 8px", fontSize: 11, fontWeight: 700, minWidth: 22, height: 18 }}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
});

// ── TicketRow (memoized — no re-render unless ticket data changes) ──────────

const TicketRow = memo(({ t, navigate, role, activeTab, isLast }) => {
  const { t: i18n } = useTranslation("technicien");
  const technician = t.assignedTo || t.users_tickets_assigned_toTousers || null;

  const empName = t.employee
    ? `${t.employee.name || ""} ${t.employee.surname || ""}`.trim() || null
    : t.employee_name || null;

  const techName = technician && typeof technician === "object"
    ? `${technician.name || ""} ${technician.surname || ""}`.trim() || null
    : null;

  const lastDate = activeTab === "archives" ? fmtDate(t.closed_at) : fmtDate(t.assigned_at);

  const TD = ({ style, children }) => (
    <td style={{ padding: "11px 14px", fontSize: 13, whiteSpace: "nowrap", ...style }}>{children}</td>
  );
  return (
    <tr
      onClick={() => navigate(`/${role}/tickets-service/${t.id}`)}
      style={{ background: "#fff", borderBottom: isLast ? "none" : "1px solid #f1ede8", cursor: "pointer" }}
      onMouseOver={e => e.currentTarget.style.background = "#faf7f4"}
      onMouseOut={e  => e.currentTarget.style.background = "#fff"}
    >
      {/* ID */}
      <TD style={{ fontWeight: 700, color: "#c4bfb8", fontSize: 12 }}>#{t.id}</TD>

      {/* Titre */}
      <td style={{ padding: "11px 14px", maxWidth: 240 }}>
        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
          {t.title || "N/A"}
        </span>
      </td>

      {/* Catégorie */}
      <TD>
       
<Pill config={CATEGORY_CONFIG} value={t.category || t.categorie} />
      </TD>

      {/* Priorité */}
      <TD>
       <Pill config={PRIORITY_CONFIG} value={t.priority} />
      </TD>

      {/* Statut */}
      <TD>
       <Pill config={STATUS_CONFIG} value={t.status} /></TD>

      {/* SLA */}
      <td style={{ padding: "11px 14px", width: 120 }}>
        {activeTab === "archives"
          ? <span style={{ color: "#d1d5db", fontSize: 11 }}>—</span>
          : <SlaBar
  slaDueDate={t.sla_date_limite}
  slaDebut={t.sla_date_debut}
  status={t.status}
  closedAt={t.closed_at}
  slaPauseElapsed={t.sla_pause_elapsed_ms ?? null}
/>}
      </td>

      {/* Employé */}
      <TD style={{ color: "#64748b" }}>
        {empName || <span style={{ color: "#d1d5db" }}>—</span>}
      </TD>

      {/* Technicien */}
      <TD>
        {techName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: "#1d4ed8" }}>
                {(technician.name?.[0] || "").toUpperCase()}{(technician.surname?.[0] || "").toUpperCase()}
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{techName}</span>
          </div>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fb923c", fontStyle: "italic" }}>{i18n("ticketsService.row.unassigned")}</span>
        )}
      </TD>

      {/* Créé le */}
      <TD style={{ fontSize: 12, color: "#94a3b8" }}>{fmtDate(t.created_at)}</TD>

      {/* Assigné le / Clôture */}
      <TD style={{ fontSize: 12, color: "#94a3b8" }}>{lastDate}</TD>
    </tr>
  );
});

// ── Column config ──────────────────────────────────────────────────────────

const COLS = [
  { label: "ticketsService.table.id",         width: "64px"  },
  { label: "ticketsService.table.title",      width: "240px" },
  { label: "ticketsService.table.category",   width: "120px" },
  { label: "ticketsService.table.priority",   width: "105px" },
  { label: "ticketsService.table.status",     width: "150px" },
  { label: "ticketsService.table.sla",        width: "120px" },
  { label: "ticketsService.table.employee",   width: "160px" },
  { label: "ticketsService.table.technician", width: "180px" },
  { label: "ticketsService.table.createdAt",  width: "115px" },
  { label: null,                               width: "115px" }, // dynamic label
];

// ── TicketTable ────────────────────────────────────────────────────────────

const TicketTable = memo(({ tickets, navigate, role, activeTab }) => {
  const { t } = useTranslation("technicien");
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #d9d4cc", overflow: "hidden" }}>
      {tickets.length === 0 ? (
        <div style={{ padding: "56px 24px", textAlign: "center" }}>
          <HiOutlineTicket size={36} color="#d1d5db" style={{ marginBottom: 12 }} />
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>{t("ticketsService.empty")}</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 1100, borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              {COLS.map((c, i) => <col key={i} style={{ width: c.width }} />)}
            </colgroup>
            <thead>
              <tr style={{ background: "#f9f6f2", borderBottom: "2px solid #e8e2d9" }}>
                {COLS.map((c, i) => (
                  <th key={i} style={{
                    padding: "10px 14px", fontSize: 11, fontWeight: 700,
                    color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px",
                    whiteSpace: "nowrap", textAlign: "left",
                    borderRight: i < COLS.length - 1 ? "1px solid #f1ede8" : "none",
                  }}>
                    {c.label != null ? t(c.label) : (activeTab === "archives" ? t("ticketsService.table.closedAt") : t("ticketsService.table.assignedAt"))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, idx) => (
                <TicketRow
                  key={t.id}
                  t={t}
                  navigate={navigate}
                  role={role}
                  activeTab={activeTab}
                  isLast={idx === tickets.length - 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

// ── Main ───────────────────────────────────────────────────────────────────

const TicketsServicePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("technicien");

  // Parse user once (not on every render)
  const { role, serviceId } = useMemo(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    return { role: u?.role || "", serviceId: u?.serviceId || u?.service_id || null };
  }, []);

  const [tickets,     setTickets]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [dbEnums,     setDbEnums]     = useState({ statuts: [], categories: [] });
  const [serviceName, setServiceName] = useState("");

  const [activeTab,        setActiveTab]        = useState("actuels");
  const [filterSearch,     setFilterSearch]     = useState("");
  const [filterStatus,     setFilterStatus]     = useState("");
  const [filterCategory,   setFilterCategory]   = useState("");
  const [filterAssignment, setFilterAssignment] = useState("");
  const [filterYear,       setFilterYear]       = useState("");

  // Debounce search — filters only trigger 220ms after the user stops typing
  const debouncedSearch = useDebounce(filterSearch, 220);

  // ── Fetch ────────────────────────────────────────────────────────────────

const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    const userServiceId = u?.serviceId || u?.service_id;

    const [enumRes, ticketsRes] = await Promise.all([
      fetch("http://localhost:3001/api/tech/enums"),
      fetch("http://localhost:3001/api/tickets"), // ← tous les tickets pour tout le monde
    ]);

    const enumData = await enumRes.json();
    setDbEnums(enumData);

    if (!ticketsRes.ok) throw new Error("Erreur tickets");
    const allTickets = await ticketsRes.json();

    // Filtrer par service du user (technicien, manager, chef)
    const filtered = userServiceId
      ? allTickets.filter(t => (t.serviceId || t.service_id) === userServiceId)
      : allTickets;

    setTickets(filtered);
    setServiceName(filtered[0]?.serviceName || "");
  } catch (err) {
    console.error("Erreur fetchData:", err);
  } finally {
    setLoading(false);
  }
}, [serviceId, role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Partition ────────────────────────────────────────────────────────────

  const { actuelsList, archivesList, archiveYears } = useMemo(() => {
    const actuals = [], archives = [];
    const yearsSet = new Set();
    for (const t of tickets) {
      if (isArchived(t)) {
        archives.push(t);
        const y = getArchiveYear(t);
        if (y) yearsSet.add(y);
      } else {
        actuals.push(t);
      }
    }
    return { actuelsList: actuals, archivesList: archives, archiveYears: [...yearsSet].sort((a,b) => b-a) };
  }, [tickets]);

  // ── Filter (with debounced search) ───────────────────────────────────────

  const filterList = useCallback((list, withYear = false) => {
    const q = debouncedSearch.trim().toLowerCase();
    return list.filter(t => {
      const cat      = t.category || t.categorie || "";
      const assigned = !!(t.assignedTo || t.assigned_to || t.users_tickets_assigned_toTousers);
      return (
        (!q || String(t.id).includes(q) || (t.title || "").toLowerCase().includes(q)) &&
        (!filterStatus     || t.status === filterStatus) &&
        (!filterCategory   || cat      === filterCategory) &&
        (!filterAssignment || (filterAssignment === "assigned" ? assigned : !assigned)) &&
        (!withYear || !filterYear || getArchiveYear(t) === parseInt(filterYear))
      );
    });
  }, [debouncedSearch, filterStatus, filterCategory, filterAssignment, filterYear]);

  const filteredActuels  = useMemo(() => filterList(actuelsList,  false), [filterList, actuelsList]);
  const filteredArchives = useMemo(() => filterList(archivesList, true),  [filterList, archivesList]);

  const displayedTickets = activeTab === "actuels" ? filteredActuels : filteredArchives;
  const sourceList       = activeTab === "actuels" ? actuelsList     : archivesList;

  const hasFilters = filterSearch || filterStatus || filterCategory || filterAssignment || filterYear;
  const resetFilters = useCallback(() => {
    setFilterSearch(""); setFilterStatus(""); setFilterCategory("");
    setFilterAssignment(""); setFilterYear("");
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f9f6f2" }}>
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, border: "2px solid #d9d4cc", borderTopColor: "#374151", borderRadius: "50%", animation: "_spin 0.8s linear infinite" }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 2 }}>{t("ticketsService.loading")}</span>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#f9f6f2", fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e2d9", padding: "18px 32px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 3px" }}>
              {role === "manager" ? t("ticketsService.header.subtitleManager") : t("ticketsService.header.subtitle")}
            </p>
            <h1 style={{ fontSize: 21, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1 }}>
              {serviceName
                ? <>{t("ticketsService.header.titlePrefix")} <span style={{ color: "#1d4ed8" }}>{serviceName}</span></>
                : t("ticketsService.header.titleFallback")}
            </h1>
          </div>
          <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {displayedTickets.length} ticket{displayedTickets.length !== 1 ? "s" : ""}
          </span>
        </div>
        <RefreshButton onRefresh={fetchData} />
      </div>

      {/* Body */}
      <div style={{ padding: "24px 32px" }}>

        {/* Tabs */}
        <TabSwitch
          activeTab={activeTab}
          setActiveTab={tab => { setActiveTab(tab); if (tab !== "archives") setFilterYear(""); }}
          actuelCount={actuelsList.length}
          archiveCount={archivesList.length}
        />

        {/* Filters */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #d9d4cc", padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={LABEL_STYLE}>{t("ticketsService.filters.label")}</span>
              <div style={{ height: 38, display: "flex", alignItems: "center" }}>
                <HiOutlineFunnel size={16} color="#c4bfb8" />
              </div>
            </div>

            {/* Search */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={LABEL_STYLE}>{t("ticketsService.filters.search")}</span>
              <div style={{ position: "relative" }}>
                <HiOutlineMagnifyingGlass size={14} color="#94a3b8"
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder={t("ticketsService.filters.searchPlaceholder")}
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                  style={{ border: "1.5px solid #d9d4cc", borderRadius: 8, padding: "0 30px 0 32px", fontSize: 13, fontWeight: 500, color: "#1e293b", background: "#fff", outline: "none", height: 38, width: 200 }}
                  onFocus={e => e.target.style.borderColor = "#93c5fd"}
                  onBlur={e  => e.target.style.borderColor = "#d9d4cc"}
                />
                {filterSearch && (
                  <button onClick={() => setFilterSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
                    <HiOutlineXMark size={14} color="#94a3b8" />
                  </button>
                )}
              </div>
            </div>

            <FilterSelect label={t("ticketsService.filters.status")} value={filterStatus} onChange={setFilterStatus}>
              <option value="">{t("ticketsService.filters.statusAll")}</option>
              {dbEnums.statuts?.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
            </FilterSelect>

            <FilterSelect label={t("ticketsService.filters.category")} value={filterCategory} onChange={setFilterCategory}>
              <option value="">{t("ticketsService.filters.categoryAll")}</option>
              {dbEnums.categories?.map(c => <option key={c} value={c}>{CATEGORY_CONFIG[c]?.label || c}</option>)}
            </FilterSelect>

            <FilterSelect label={t("ticketsService.filters.assignment")} value={filterAssignment} onChange={setFilterAssignment}>
              <option value="">{t("ticketsService.filters.assignmentAll")}</option>
              <option value="assigned">{t("ticketsService.filters.assigned")}</option>
              <option value="unassigned">{t("ticketsService.filters.unassigned")}</option>
            </FilterSelect>

            {/* Year — archives only */}
            {activeTab === "archives" && archiveYears.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={LABEL_STYLE}>{t("ticketsService.filters.closeYear")}</span>
                <div style={{ position: "relative" }}>
                  <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ ...SELECT_STYLE, minWidth: 130 }}>
                    <option value="">{t("ticketsService.filters.closeYearAll")}</option>
                    {archiveYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <HiOutlineChevronDown size={13} color="#94a3b8" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>
            )}

            {/* Reset */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ ...LABEL_STYLE, visibility: "hidden" }}>_</span>
              <button onClick={resetFilters} style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 14px", border: `1.5px solid ${hasFilters ? "#fca5a5" : "#d9d4cc"}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: hasFilters ? "#dc2626" : "#94a3b8", background: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}>
                <HiOutlineArrowPath size={14} />
                {t("ticketsService.filters.reset")}
              </button>
            </div>

            {/* Count */}
            <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <span style={{ ...LABEL_STYLE, visibility: "hidden" }}>_</span>
              <div style={{ height: 38, display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{displayedTickets.length}</span>{" "}
                  ticket{displayedTickets.length !== 1 ? "s" : ""}
                  {displayedTickets.length !== sourceList.length && <> {t("ticketsService.filters.outOf", { total: sourceList.length })}</>}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Table */}
        <TicketTable tickets={displayedTickets} navigate={navigate} role={role} activeTab={activeTab} />

      </div>
    </div>
  );
};

export default TicketsServicePage;