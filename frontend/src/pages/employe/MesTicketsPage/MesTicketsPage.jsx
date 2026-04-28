import { useState, useEffect, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HiOutlineTicket, HiOutlineArchiveBox, HiOutlineArrowPath,
  HiOutlineMagnifyingGlass, HiOutlineXMark,
  HiOutlineTag, HiOutlineExclamationCircle, HiOutlineCalendarDays,
  HiOutlineBuildingOffice2, HiOutlineFunnel,
} from "react-icons/hi2";
import RefreshButton from "../../../components/common/RefreshButton";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "../../../config/styles";
import Pill from "../../../components/common/Pill";

// ── Avatar ────────────────────────────────────────
const Avatar = ({ name, surname, color = "#dbeafe", textColor = "#1d4ed8" }) => (
  <div style={{ width: 24, height: 24, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <span style={{ fontSize: 8, fontWeight: 900, color: textColor }}>
      {(name?.[0] || "").toUpperCase()}{(surname?.[0] || "").toUpperCase()}
    </span>
  </div>
);

// ── Config ────────────────────────────────────────
const THIS_YEAR = new Date().getFullYear();
const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

// ── Helpers ───────────────────────────────────────
const fmtDate = (str) => {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("fr-FR", { month: "short" })} ${d.getFullYear()}`;
};

const getArchiveYear  = (t) => t.closed_at ? new Date(t.closed_at).getFullYear() : null;
const getCreatedMonth = (t) => t.created_at ? new Date(t.created_at).getMonth() + 1 : null;
function isArchived(ticket) {
  if (ticket.status === "closed" || ticket.status === "rejected") {
    const year = getArchiveYear(ticket);
    return year !== null && year < THIS_YEAR;
  }
  return false;
}

// ── TabSwitch (style commun) ──────────────────────
const TabSwitch = memo(({ activeTab, setActiveTab, actuelCount, archiveCount, t }) => {
  const tabs = [
    { key: "actuels",  label: t("mesTickets.tabs.current"),                        Icon: HiOutlineTicket,    count: actuelCount  },
    { key: "archives", label: t("mesTickets.tabs.archives", { year: THIS_YEAR }),  Icon: HiOutlineArchiveBox, count: archiveCount },
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

// ── Filter primitives (style commun) ─────────────
const FilterInput = ({ placeholder, value, onChange }) => (
  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
    <HiOutlineMagnifyingGlass size={13} color="#94a3b8" style={{ position: "absolute", left: 9, pointerEvents: "none" }} />
    <input
      type="text" placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: "0 26px 0 28px", height: 32, width: 175, fontSize: 12, color: "#1e293b", background: "#fff", outline: "none" }}
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
export default function MesTicketsPage() {
  const { t }    = useTranslation();
  const navigate = useNavigate();

  const [ticketsData,    setTicketsData]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [mousePos,       setMousePos]       = useState({ x: 0, y: 0 });
  const [hoveredId,      setHoveredId]      = useState(null);

  const [dbEnums,     setDbEnums]     = useState({ statuts: [], priorites: [], categories: [] });
  const [dbServices,  setDbServices]  = useState([]);

  const [activeTab,       setActiveTab]       = useState("actuels");
  const [filterSearch,    setFilterSearch]    = useState("");
  const [filterStatus,    setFilterStatus]    = useState("");
  const [filterPriority,  setFilterPriority]  = useState("");
  const [filterService,   setFilterService]   = useState("");
  const [filterCategory,  setFilterCategory]  = useState("");
  const [filterMonth,     setFilterMonth]     = useState("");
  const [filterYear,      setFilterYear]      = useState("");

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

  const { actuelsList, archivesList, archiveYears } = useMemo(() => {
    const actuels = [], archives = [];
    const yearsSet = new Set();
    for (const ticket of ticketsData) {
      if (isArchived(ticket)) {
        archives.push(ticket);
        const y = getArchiveYear(ticket);
        if (y) yearsSet.add(y);
      } else {
        actuels.push(ticket);
      }
    }
    return { actuelsList: actuels, archivesList: archives, archiveYears: [...yearsSet].sort((a, b) => b - a) };
  }, [ticketsData]);

  const filterList = (list, isArchive = false) => {
    const q = filterSearch.trim().toLowerCase();
    return list
      .filter(ticket => {
        const month = getCreatedMonth(ticket);
        return (
          (!q              || String(ticket.id).includes(q) || (ticket.title || "").toLowerCase().includes(q)) &&
          (!filterStatus   || ticket.status   === filterStatus)   &&
          (!filterPriority || ticket.priority === filterPriority) &&
          (!filterService  || ticket.service  === filterService)  &&
          (!filterCategory || ticket.category === filterCategory) &&
          (filterMonth === "" || month === parseInt(filterMonth))    &&
          (!isArchive || filterYear === "" || getArchiveYear(ticket) === parseInt(filterYear))
        );
      })
      .sort((a, b) => {
        const da = isArchive ? (a.closed_at || a.created_at) : (a.updated_at || a.created_at);
        const db = isArchive ? (b.closed_at || b.created_at) : (b.updated_at || b.created_at);
        return new Date(db) - new Date(da);
      });
  };

  const filteredActuels  = useMemo(() => filterList(actuelsList,  false), [actuelsList,  filterSearch, filterStatus, filterPriority, filterService, filterCategory, filterMonth]);
  const filteredArchives = useMemo(() => filterList(archivesList, true),  [archivesList, filterSearch, filterStatus, filterPriority, filterService, filterCategory, filterMonth, filterYear]);

  const displayedTickets = activeTab === "actuels" ? filteredActuels : filteredArchives;
  const sourceList       = activeTab === "actuels" ? actuelsList     : archivesList;

  const hasFilters = filterSearch || filterStatus || filterPriority || filterService || filterCategory || filterMonth || filterYear;
  const resetFilters = () => {
    setFilterSearch(""); setFilterStatus(""); setFilterPriority("");
    setFilterService(""); setFilterCategory(""); setFilterMonth(""); setFilterYear("");
  };

  // ── Loading / Error ──
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#fbfbfb" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 28, height: 28, border: "2px solid #d9d4cc", borderTopColor: "#374151", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 2 }}>Chargement…</span>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ margin: 24, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>
      {t("common.error")} : {error}
    </div>
  );

  return (
    <div
      style={{ minHeight: "100vh", background: "#faf9f7", fontFamily: "sans-serif" }}
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {/* ── Tooltip ── */}
      {hoveredId && (
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

      {/* ── Header ── */}
      <div style={{ background: "#faf9f7", borderBottom: "1px solid #e8e2d9", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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

      <div style={{ padding: "20px 28px" }}>

        {/* ── Tabs ── */}
        <TabSwitch
          activeTab={activeTab}
          setActiveTab={(tab) => { setActiveTab(tab); if (tab !== "archives") setFilterYear(""); }}
          actuelCount={actuelsList.length}
          archiveCount={archivesList.length}
          t={t}
        />

        {/* ── Filtres inline (style commun) ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, background: "#fff", border: "1px solid #e8e2d9", borderRadius: 10, padding: "7px 12px", overflowX: "auto" }}>

          <FilterInput
            placeholder={t("common.search") || "Rechercher…"}
            value={filterSearch}
            onChange={setFilterSearch}
          />
          <Sep />
          <FilterSelect icon={HiOutlineTag} value={filterCategory} onChange={setFilterCategory} minW={110}>
            <option value="">{t("mesTickets.filters.allCategories")}</option>
            {dbEnums.categories?.map(c => <option key={c} value={c}>{c}</option>)}
          </FilterSelect>
          <FilterSelect icon={HiOutlineExclamationCircle} value={filterStatus} onChange={setFilterStatus} minW={105}>
            <option value="">{t("mesTickets.filters.allStatuses")}</option>
            {dbEnums.statuts?.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
          </FilterSelect>
          <FilterSelect icon={HiOutlineFunnel} value={filterPriority} onChange={setFilterPriority} minW={110}>
            <option value="">{t("mesTickets.filters.allPriorities")}</option>
            {dbEnums.priorites?.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p]?.label || p}</option>)}
          </FilterSelect>
          <FilterSelect icon={HiOutlineBuildingOffice2} value={filterService} onChange={setFilterService} minW={110}>
            <option value="">{t("mesTickets.filters.allServices")}</option>
            {dbServices.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </FilterSelect>
         
<FilterSelect icon={HiOutlineCalendarDays} value={filterMonth} onChange={setFilterMonth} minW={90}>
  <option value="">Mois</option>
  {MONTHS_FR.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
</FilterSelect>

          {/* Année — archives seulement */}
          {activeTab === "archives" && archiveYears.length > 0 && (
            <FilterSelect value={filterYear} onChange={setFilterYear} minW={75}>
              <option value="">{t("mesTickets.filters.allYears")}</option>
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
            {t("mesTickets.filters.reset")}
          </button>

          <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>{displayedTickets.length}</span>
            {displayedTickets.length !== sourceList.length && <> / {sourceList.length}</>} ticket{displayedTickets.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Tableau ── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e2d9", overflow: "hidden" }}>
          {displayedTickets.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <HiOutlineTicket size={32} color="#d1d5db" style={{ marginBottom: 10 }} />
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>{t("common.noTicketsFilter")}</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 920 }}>
                <colgroup>
                  <col style={{ width: 55  }} />
                  <col style={{ width: 210 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 90  }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 105 }} />
                  <col style={{ width: 110 }} />
                </colgroup>
                <thead>
                  <tr style={{ background: "#faf9f7", borderBottom: "1.5px solid #e8e2d9" }}>
                    {[
                      t("table.id"),
                      t("table.title"),
                      t("table.service"),
                      t("table.assignedTo"),
                      t("table.priority"),
                      t("table.status"),
                      t("table.createdAt"),
                      activeTab === "archives" ? t("table.closedAt") : t("table.lastUpdate"),
                    ].map((h, i) => (
                      <th key={i} style={{ padding: "9px 10px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", textAlign: "left" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedTickets.map((ticket, idx) => {
                    const lastDate = activeTab === "archives"
                      ? fmtDate(ticket.closed_at)
                      : fmtDate(ticket.updated_at || ticket.created_at);
                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => navigate(`/employee/ticket/${ticket.id}`)}
                        onMouseEnter={() => setHoveredId(ticket.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{ background: "#fff", borderBottom: idx === displayedTickets.length - 1 ? "none" : "1px solid #f4f0ec", cursor: "pointer" }}
                        onMouseOver={e => e.currentTarget.style.background = "#faf8f5"}
                        onMouseOut={e  => e.currentTarget.style.background = "#fff"}
                      >
                        <td style={{ padding: "9px 10px", fontSize: 11, fontWeight: 700, color: "#c4bfb8" }}>
                          #{ticket.id}
                        </td>
                        <td style={{ padding: "9px 10px", overflow: "hidden" }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
                            {ticket.title}
                          </span>
                        </td>
                        <td style={{ padding: "9px 10px", fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ticket.service || <span style={{ color: "#d1d5db" }}>—</span>}
                        </td>
                        <td style={{ padding: "9px 10px" }}>
                          {ticket.technicien
                            ? (() => {
                                const parts = ticket.technicien.trim().split(" ");
                                const tName    = parts[0] || "";
                                const tSurname = parts[1] || "";
                                return (
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <Avatar name={tName} surname={tSurname} />
                                    <span style={{ fontSize: 12, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {ticket.technicien}
                                    </span>
                                  </div>
                                );
                              })()
                            : <span style={{ fontSize: 11, fontWeight: 700, color: "#fb923c", fontStyle: "italic" }}>{t("common.unassigned")}</span>
                          }
                        </td>
                        <td style={{ padding: "9px 10px" }}>
                          <Pill config={PRIORITY_CONFIG} value={ticket.priority} />
                        </td>
                        <td style={{ padding: "9px 10px" }}>
                          <Pill config={STATUS_CONFIG} value={ticket.status} />
                        </td>
                        <td style={{ padding: "9px 10px", fontSize: 11, color: "#94a3b8" }}>
                          {fmtDate(ticket.created_at)}
                        </td>
                        <td style={{ padding: "9px 10px", fontSize: 11, color: "#94a3b8" }}>
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

      </div>
    </div>
  );
}