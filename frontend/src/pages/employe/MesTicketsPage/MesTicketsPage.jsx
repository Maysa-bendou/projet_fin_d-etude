import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HiOutlineTicket,
  HiOutlineArchiveBox,
  HiOutlineChevronDown,
  HiOutlineArrowPath,
  HiOutlineFunnel,
} from "react-icons/hi2";
import RefreshButton from "../../../components/common/RefreshButton";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "../../../config/styles";
import Pill from "../../../components/common/Pill";

// ── Config ─────────────────────────────────────────────────────────────────

const THIS_YEAR = new Date().getFullYear();

// ── Date helpers ───────────────────────────────────────────────────────────

const fmtDate = (str, withTime = false) => {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  const day   = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("fr-FR", { month: "short" });
  const year  = d.getFullYear();
  if (!withTime) return `${day} ${month} ${year}`;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} · ${hh}:${mm}`;
};

// ── Archive logic ──────────────────────────────────────────────────────────

const getArchiveYear = (t) => {
  if (!t.closed_at) return null;
  return new Date(t.closed_at).getFullYear();
};

function isArchived(ticket) {
  if (ticket.status === "closed" || ticket.status === "rejected") {
    const year = getArchiveYear(ticket);
    return year !== null && year < THIS_YEAR;
  }
  return false;
}

// ── Shared UI helpers ──────────────────────────────────────────────────────

const LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  display: "block",
  marginBottom: 5,
};

const selectStyle = {
  border: "1.5px solid #d9d4cc",
  borderRadius: 8,
  padding: "8px 36px 8px 12px",
  fontSize: 13,
  fontWeight: 500,
  color: "#1e293b",
  background: "#fff",
  outline: "none",
  appearance: "none",
  cursor: "pointer",
  minWidth: 160,
  height: 38,
};

const FilterSelect = ({ label, value, onChange, children }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <span style={LABEL_STYLE}>{label}</span>
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
        {children}
      </select>
      <HiOutlineChevronDown
        size={13} color="#94a3b8"
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      />
    </div>
  </div>
);

// ── Tab Switch ─────────────────────────────────────────────────────────────

const TabSwitch = ({ activeTab, setActiveTab, actuelCount, archiveCount }) => {
  const { t } = useTranslation('employee');

  const tabs = [
    {
      key: "actuels",
      label: t("mesTickets.tabs.current"),
      Icon: HiOutlineTicket,
      count: actuelCount,
      activeColor: "#1d4ed8",
      activeBg: "#eff6ff",
      activeBorder: "#bfdbfe",
    },
    {
      key: "archives",
      label: t("mesTickets.tabs.archives", { year: THIS_YEAR }),
      Icon: HiOutlineArchiveBox,
      count: archiveCount,
      activeColor: "#6b7280",
      activeBg: "#f3f4f6",
      activeBorder: "#d1d5db",
    },
  ];

  return (
    <div style={{
      display: "inline-flex",
      background: "#ede9e3",
      borderRadius: 14,
      padding: "4px",
      gap: 2,
      marginBottom: 24,
      border: "1px solid #d9d4cc",
      boxShadow: "inset 0 1px 4px rgba(0,0,0,0.07)",
    }}>
      {tabs.map(({ key, label, Icon, count, activeColor, activeBg, activeBorder }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 22px",
              borderRadius: 10,
              border: isActive ? `1.5px solid ${activeBorder}` : "1.5px solid transparent",
              background: isActive ? "#fbfbfb" : "transparent",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? activeColor : "#94a3b8",
              transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: isActive
                ? "0 2px 8px rgba(0,0,0,0.09), 0 1px 2px rgba(0,0,0,0.06)"
                : "none",
              whiteSpace: "nowrap",
            }}
          >
            <Icon
              size={15}
              style={{
                color: isActive ? activeColor : "#c4bfb8",
                transition: "color 0.2s",
                flexShrink: 0,
              }}
            />
            <span>{label}</span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: isActive ? activeBg : "#e2ddd7",
              color: isActive ? activeColor : "#a8a29e",
              border: isActive ? `1px solid ${activeBorder}` : "1px solid transparent",
              borderRadius: 20,
              padding: "0 8px",
              fontSize: 11,
              fontWeight: 700,
              minWidth: 22,
              height: 18,
              lineHeight: "18px",
              transition: "all 0.2s",
            }}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ── Ticket Table ───────────────────────────────────────────────────────────

const CELL = { padding: "13px 14px", fontSize: 13, whiteSpace: "nowrap" };

const TicketTable = ({ tickets, navigate, hoveredTicketId, setHoveredTicketId, activeTab }) => {
  const { t } = useTranslation();

  const columns = [
    t("table.id"),
    t("table.title"),
    t("table.service"),
    t("table.assignedTo"),
    t("table.priority"),
    t("table.status"),
    t("table.createdAt"),
    activeTab === "archives" ? t("table.closedAt") : t("table.lastUpdate"),
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #d9d4cc" }}>
      {tickets.length === 0 ? (
        <div style={{ padding: "56px 24px", textAlign: "center" }}>
          <HiOutlineTicket size={36} color="#d1d5db" style={{ marginBottom: 12 }} />
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
            {t("common.noTicketsFilter")}
          </p>
        </div>
      ) : (
        <div style={{ margin: 16, border: "1px solid #e8e2d9", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#faf9f7" }}>
                {columns.map(col => (
                  <th key={col} style={{
                    padding: "11px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    borderBottom: "1px solid #e8e2d9",
                    whiteSpace: "nowrap",
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, idx) => {
                const lastDate = activeTab === "archives"
                  ? fmtDate(ticket.closed_at)
                  : fmtDate(ticket.updated_at || ticket.created_at);

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/employee/ticket/${ticket.id}`)}
                    onMouseEnter={() => setHoveredTicketId(ticket.id)}
                    onMouseLeave={() => setHoveredTicketId(null)}
                    style={{
                      background: "#fff",
                      borderBottom: idx < tickets.length - 1 ? "1px solid #f1ede8" : "none",
                      cursor: "pointer",
                      transition: "background 0.12s",
                    }}
                    onMouseOver={e => e.currentTarget.style.background = "#faf7f4"}
                    onMouseOut={e => e.currentTarget.style.background = "#fff"}
                  >
                    <td style={{ ...CELL, fontWeight: 600, color: "#c4bfb8" }}>
                      #{ticket.id}
                    </td>
                    <td style={{ ...CELL, fontWeight: 600, color: "#0f172a", maxWidth: 220 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {ticket.title}
                      </span>
                    </td>
                    <td style={{ ...CELL, color: "#64748b" }}>
                      {ticket.service || <span style={{ color: "#d1d5db" }}>—</span>}
                    </td>
                    <td style={{ ...CELL, color: "#64748b" }}>
                      {ticket.technicien || <span style={{ color: "#d1d5db" }}>{t("common.unassigned")}</span>}
                    </td>
                    <td style={CELL}>
                      <Pill config={PRIORITY_CONFIG} value={ticket.priority} />
                    </td>
                    <td style={CELL}>
                      <Pill config={STATUS_CONFIG} value={ticket.status} />
                    </td>
                    <td style={{ ...CELL, color: "#94a3b8" }}>
                      {fmtDate(ticket.created_at)}
                    </td>
                    <td style={{ ...CELL, color: "#94a3b8" }}>
                      {lastDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────

export default function MesTicketsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ticketsData, setTicketsData]         = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [mousePos, setMousePos]               = useState({ x: 0, y: 0 });
  const [hoveredTicketId, setHoveredTicketId] = useState(null);

  const [dbEnums, setDbEnums]       = useState({ statuts: [], priorites: [], categories: [] });
  const [dbServices, setDbServices] = useState([]);

  const [activeTab,      setActiveTab]      = useState("actuels");
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterService,  setFilterService]  = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterYear,     setFilterYear]     = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) { navigate("/login"); return; }

      const [enumRes, serviceRes, ticketRes] = await Promise.all([
        fetch("http://localhost:3001/api/tech/enums"),
        fetch("http://localhost:3001/api/tech/services"),
        fetch(`http://localhost:3001/api/tickets/my/${user.id}`),
      ]);

      setDbEnums(await enumRes.json());
      setDbServices(await serviceRes.json());
      if (!ticketRes.ok) throw new Error(t("mesTickets.fetchError"));
      setTicketsData(await ticketRes.json());
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [navigate]);

  const applyCommonFilters = (list, tab) =>
    list
      .filter(ticket =>
        (!filterStatus   || ticket.status   === filterStatus)   &&
        (!filterPriority || ticket.priority === filterPriority) &&
        (!filterService  || ticket.service  === filterService)  &&
        (!filterCategory || ticket.category === filterCategory)
      )
      .sort((a, b) => {
        const da = tab === "archives" ? (a.closed_at || a.created_at) : (a.updated_at || a.created_at);
        const db = tab === "archives" ? (b.closed_at || b.created_at) : (b.updated_at || b.created_at);
        return new Date(db) - new Date(da);
      });

  const { actuels, archives, archiveYears } = useMemo(() => {
    const actuelsList  = [];
    const archivesList = [];
    const yearsSet     = new Set();

    for (const ticket of ticketsData) {
      if (isArchived(ticket)) {
        archivesList.push(ticket);
        const y = getArchiveYear(ticket);
        if (y) yearsSet.add(y);
      } else {
        actuelsList.push(ticket);
      }
    }

    return {
      actuels:      applyCommonFilters(actuelsList, "actuels"),
      archives:     applyCommonFilters(archivesList, "archives")
                      .filter(ticket => !filterYear || getArchiveYear(ticket) === parseInt(filterYear)),
      archiveYears: [...yearsSet].sort((a, b) => b - a),
    };
  }, [ticketsData, filterStatus, filterPriority, filterService, filterCategory, filterYear]);

  const hasFilters = filterStatus || filterPriority || filterService || filterCategory || filterYear;
  const resetFilters = () => {
    setFilterStatus(""); setFilterPriority(""); setFilterService("");
    setFilterCategory(""); setFilterYear("");
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "#1d4ed8", fontWeight: 600, background: "#faf9f7", minHeight: "100vh" }}>
      {t("common.loading")}
    </div>
  );
  if (error) return (
    <div style={{ padding: 40, textAlign: "center", color: "#dc2626", background: "#faf9f7", minHeight: "100vh" }}>
      {t("common.error")} : {error}
    </div>
  );

  const displayedTickets = activeTab === "actuels" ? actuels : archives;

  return (
    <div
      style={{ padding: "32px", background: "#faf9f7", minHeight: "100vh" }}
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {/* Tooltip */}
      {hoveredTicketId && (
        <div style={{
          position: "fixed", pointerEvents: "none", zIndex: 50,
          left: mousePos.x, top: mousePos.y - 14,
          transform: "translateX(-50%) translateY(-100%)",
          background: "#1e293b", color: "#fff", fontSize: 11,
          padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap",
        }}>
          {t("common.clickForDetails")}
        </div>
      )}

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 28,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 0px 0" }}>
           {t("mesTickets.title")}
          </h1>
          <p style={{ fontSize: 14, color: "#53575c", margin: 0, fontWeight: 530 }}>
           {t("mesTickets.subtitle")}
          </p>
        </div>
        <RefreshButton onRefresh={fetchData} />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <TabSwitch
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== "archives") setFilterYear("");
        }}
        actuelCount={actuels.length}
        archiveCount={archives.length}
      />

      {/* ── Filters bar ─────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #d9d4cc",
        padding: "16px 20px",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={LABEL_STYLE}>{t("mesTickets.filters.label")}</span>
            <div style={{ height: 38, display: "flex", alignItems: "center", paddingLeft: 2 }}>
              <HiOutlineFunnel size={16} color="#c4bfb8" />
            </div>
          </div>

          <FilterSelect label={t("mesTickets.filters.status")} value={filterStatus} onChange={setFilterStatus}>
            <option value="">{t("mesTickets.filters.allStatuses")}</option>
            {dbEnums.statuts?.map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
            ))}
          </FilterSelect>

          <FilterSelect label={t("mesTickets.filters.category")} value={filterCategory} onChange={setFilterCategory}>
            <option value="">{t("mesTickets.filters.allCategories")}</option>
            {dbEnums.categories?.map(c => <option key={c} value={c}>{c}</option>)}
          </FilterSelect>

          <FilterSelect label={t("mesTickets.filters.priority")} value={filterPriority} onChange={setFilterPriority}>
            <option value="">{t("mesTickets.filters.allPriorities")}</option>
            {dbEnums.priorites?.map(p => (
              <option key={p} value={p}>{PRIORITY_CONFIG[p]?.label || p}</option>
            ))}
          </FilterSelect>

          <FilterSelect label={t("mesTickets.filters.service")} value={filterService} onChange={setFilterService}>
            <option value="">{t("mesTickets.filters.allServices")}</option>
            {dbServices.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </FilterSelect>

          {/* Year — archives tab only */}
          {activeTab === "archives" && archiveYears.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={LABEL_STYLE}>{t("mesTickets.filters.closeYear")}</span>
              <div style={{ position: "relative" }}>
                <select
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                  style={{ ...selectStyle, minWidth: 130 }}
                >
                  <option value="">{t("mesTickets.filters.allYears")}</option>
                  {archiveYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <HiOutlineChevronDown size={13} color="#94a3b8" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>
          )}

          {/* Reset button */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ ...LABEL_STYLE, visibility: "hidden" }}>_</span>
            <button
              onClick={resetFilters}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                height: 38,
                padding: "0 14px",
                border: `1.5px solid ${hasFilters ? "#fca5a5" : "#d9d4cc"}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: hasFilters ? "#dc2626" : "#94a3b8",
                background: "#fff",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <HiOutlineArrowPath size={14} />
              {t("mesTickets.filters.reset")}
            </button>
          </div>

          {/* Count — pushed right */}
          <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <span style={{ ...LABEL_STYLE, visibility: "hidden" }}>_</span>
            <div style={{ height: 38, display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{displayedTickets.length}</span>{" "}
                {t("mesTickets.ticketCount", { count: displayedTickets.length })}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <TicketTable
        tickets={displayedTickets}
        navigate={navigate}
        hoveredTicketId={hoveredTicketId}
        setHoveredTicketId={setHoveredTicketId}
        activeTab={activeTab}
      />
    </div>
  );
}