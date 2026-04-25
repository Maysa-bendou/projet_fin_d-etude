import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineTicket,
  HiOutlineArchiveBox,
  HiOutlineChevronDown,
  HiOutlineArrowPath,
  HiOutlineFunnel,
} from "react-icons/hi2";
import RefreshButton from "../../../components/common/RefreshButton";
// AJOUTER après les imports existants
import { PRIORITY_CONFIG, STATUS_CONFIG } from "../../../config/styles";
import Pill from "../../../components/common/Pill";
// ── Config ─────────────────────────────────────────────────────────────────


const THIS_YEAR = new Date().getFullYear();

// ── Date helpers ───────────────────────────────────────────────────────────

/** Format any ISO/date string → "14 Jan 2025  10:32" */
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
  const tabs = [
    {
      key: "actuels",
      label: "Tickets actuels",
      Icon: HiOutlineTicket,
      count: actuelCount,
      activeColor: "#1d4ed8",
      activeBg: "#eff6ff",
      activeBorder: "#bfdbfe",
    },
    {
      key: "archives",
      label: `Archives (avant ${THIS_YEAR})`,
      Icon: HiOutlineArchiveBox,
      count: archiveCount,
      activeColor: "#6b7280",
      activeBg: "#f3f4f6",
      activeBorder: "#d1d5db",
    },
  ];

  return (
    /* Outer pill track */
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
              background: isActive ? "#ffffff" : "transparent",
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
            {/* Badge */}
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

const TicketTable = ({ tickets, navigate, hoveredTicketId, setHoveredTicketId, activeTab }) => (
  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #d9d4cc" }}>
    {tickets.length === 0 ? (
      <div style={{ padding: "56px 24px", textAlign: "center" }}>
        <HiOutlineTicket size={36} color="#d1d5db" style={{ marginBottom: 12 }} />
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
          Aucun ticket pour les filtres sélectionnés.
        </p>
      </div>
    ) : (
      <div style={{ margin: 16, border: "1px solid #e8e2d9", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f9f6f2" }}>
              {[
                "ID", "Titre", "Service", "Assigné à", "Priorité", "Statut",
                "Date création",
                activeTab === "archives" ? "Date clôture" : "Dernière MAJ",
              ].map(col => (
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
            {tickets.map((t, idx) => {
             
              const lastDate = activeTab === "archives"
  ? fmtDate(t.closed_at)
  : fmtDate(t.updated_at || t.created_at);

              return (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/employee/ticket/${t.id}`)}
                  onMouseEnter={() => setHoveredTicketId(t.id)}
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
                  {/* ID */}
                  <td style={{ ...CELL, fontWeight: 600, color: "#c4bfb8" }}>
                    #{t.id}
                  </td>

                  {/* Title */}
                  <td style={{ ...CELL, fontWeight: 600, color: "#0f172a", maxWidth: 220 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {t.title}
                    </span>
                  </td>

                  {/* Service */}
                  <td style={{ ...CELL, color: "#64748b" }}>
                    {t.service || <span style={{ color: "#d1d5db" }}>—</span>}
                  </td>

                  {/* Assigned to */}
                  <td style={{ ...CELL, color: "#64748b" }}>
                    {t.technicien || <span style={{ color: "#d1d5db" }}>Non assigné</span>}
                  </td>

                  {/* Priority */}
                  <td style={CELL}>
                    <Pill config={PRIORITY_CONFIG} value={t.priority} />
                  </td>

                  {/* Status */}
                  <td style={CELL}>
                   <Pill config={STATUS_CONFIG} value={t.status} />

                  </td>

                  {/* Date création — same format as last column */}
                  <td style={{ ...CELL, color: "#94a3b8" }}>
                    {fmtDate(t.created_at)}
                  </td>

                  {/* Last date (MAJ or clôture) */}
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

// ── Main page ──────────────────────────────────────────────────────────────

export default function MesTicketsPage() {
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
      if (!ticketRes.ok) throw new Error("Erreur lors de la récupération des tickets");
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
      .filter(t =>
        (!filterStatus   || t.status   === filterStatus)   &&
        (!filterPriority || t.priority === filterPriority) &&
        (!filterService  || t.service  === filterService)  &&
        (!filterCategory || t.category === filterCategory)
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

    for (const t of ticketsData) {
      if (isArchived(t)) {
        archivesList.push(t);
        const y = getArchiveYear(t);
        if (y) yearsSet.add(y);
      } else {
        actuelsList.push(t);
      }
    }

    return {
      actuels:      applyCommonFilters(actuelsList, "actuels"),
      archives:     applyCommonFilters(archivesList, "archives")
                      .filter(t => !filterYear || getArchiveYear(t) === parseInt(filterYear)),
      archiveYears: [...yearsSet].sort((a, b) => b - a),
    };
  }, [ticketsData, filterStatus, filterPriority, filterService, filterCategory, filterYear]);

  const hasFilters = filterStatus || filterPriority || filterService || filterCategory || filterYear;
  const resetFilters = () => {
    setFilterStatus(""); setFilterPriority(""); setFilterService("");
    setFilterCategory(""); setFilterYear("");
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "#1d4ed8", fontWeight: 600, background: "#f9f6f2", minHeight: "100vh" }}>
      Chargement des tickets…
    </div>
  );
  if (error) return (
    <div style={{ padding: 40, textAlign: "center", color: "#dc2626", background: "#f9f6f2", minHeight: "100vh" }}>
      Erreur : {error}
    </div>
  );

  const displayedTickets = activeTab === "actuels" ? actuels : archives;

  return (
    <div
      style={{ padding: "32px", background: "#f9f6f2", minHeight: "100vh" }}
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
          Cliquer pour voir les détails
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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>
            Mes Tickets
          </h1>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            Suivez et gérez l'état de vos demandes de support.
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
        {/* Row: label + selects + reset + count */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>

          {/* "Filtres" label aligned at top like the others, then icon below */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={LABEL_STYLE}>Filtres</span>
            <div style={{
              height: 38,
              display: "flex",
              alignItems: "center",
              paddingLeft: 2,
            }}>
              <HiOutlineFunnel size={16} color="#c4bfb8" />
            </div>
          </div>

          <FilterSelect label="Statut" value={filterStatus} onChange={setFilterStatus}>
            <option value="">Tous les statuts</option>
            {dbEnums.statuts?.map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
            ))}
          </FilterSelect>

          <FilterSelect label="Catégorie" value={filterCategory} onChange={setFilterCategory}>
            <option value="">Toutes les catégories</option>
            {dbEnums.categories?.map(c => <option key={c} value={c}>{c}</option>)}
          </FilterSelect>

          <FilterSelect label="Priorité" value={filterPriority} onChange={setFilterPriority}>
            <option value="">Toutes les priorités</option>
            {dbEnums.priorites?.map(p => (
              <option key={p} value={p}>{PRIORITY_CONFIG[p]?.label || p}</option>
            ))}
          </FilterSelect>

          <FilterSelect label="Service" value={filterService} onChange={setFilterService}>
            <option value="">Tous les services</option>
            {dbServices.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </FilterSelect>

          {/* Year — archives tab only */}
          {activeTab === "archives" && archiveYears.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={LABEL_STYLE}>Année de clôture</span>
              <div style={{ position: "relative" }}>
                <select
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                  style={{ ...selectStyle, minWidth: 130 }}
                >
                  <option value="">Toutes</option>
                  {archiveYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <HiOutlineChevronDown size={13} color="#94a3b8" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>
          )}

          {/* Reset — aligned to bottom of selects */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* invisible label spacer so button sits at the same baseline */}
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
              Réinitialiser
            </button>
          </div>

          {/* Count — pushed right */}
          <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <span style={{ ...LABEL_STYLE, visibility: "hidden" }}>_</span>
            <div style={{ height: 38, display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{displayedTickets.length}</span>{" "}
                ticket{displayedTickets.length !== 1 ? "s" : ""}
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