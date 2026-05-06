import React, {
  useState, useEffect, useMemo, useCallback, memo
} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HiOutlineTicket, HiOutlineArchiveBox, HiOutlineArrowPath,
  HiOutlineMagnifyingGlass, HiOutlineXMark,
  HiOutlineTag, HiOutlineExclamationCircle, HiOutlineCheckCircle,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import RefreshButton from "../../../components/common/RefreshButton";
import { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG } from "../../../config/styles";
import Pill from "../../../components/common/Pill";

const THIS_YEAR = new Date().getFullYear();

// FIX: locale-aware date formatter factory — locale passed from component
const makeFmtDate = (locale) => (str) => {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return `${String(d.getDate()).padStart(2,"0")} ${d.toLocaleString(locale,{month:"short"})} ${d.getFullYear()}`;
};

// FIX: locale-aware month list for filter dropdown
const makeMonths = (locale) =>
  Array.from({ length: 12 }, (_, i) =>
    new Date(2024, i, 1).toLocaleString(locale, { month: "short" })
  );

const getArchiveYear  = (t) => t.closed_at  ? new Date(t.closed_at).getFullYear()  : null;
const getMonth = (dateStr) => dateStr ? new Date(dateStr).getMonth() : null;

const isArchived = (t) => {
  if (t.status !== "closed" && t.status !== "rejected") return false;
  const y = getArchiveYear(t);
  return y !== null && y < THIS_YEAR;
};

function useDebounce(value, delay = 220) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── SLA Bar ────────────────────────────────────────────────────────────────
// FIX: useTranslation("technicien") — single namespace, NOT array
const SlaBar = memo(({ slaDueDate, slaDebut, status, closedAt, slaPauseElapsed }) => {
  const { t } = useTranslation("technicien");
  if (!slaDueDate) return <span style={{ color:"#94a3b8", fontSize:11, fontStyle:"italic" }}>N/A</span>;
  const PAUSED   = ["pending","pending_supplier"];
  const TERMINAL = ["resolved","closed","rejected"];
  const now = Date.now();
  const due = new Date(slaDueDate).getTime();
  const debut = slaDebut ? new Date(slaDebut).getTime() : due - 86400000;
  const win = due - debut;

  if (TERMINAL.includes(status)) {
    const closed = closedAt ? new Date(closedAt).getTime() : due;
    const exceeded = closed > due;
    const delta = Math.abs(closed - due);
    const used = exceeded ? win + delta : win - (due - closed);
    const pct = Math.min(100, Math.max(0, (used / win) * 100));
    const h = Math.floor(delta / 3600000), m = Math.floor((delta % 3600000) / 60000);
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
        <div style={{ height:3, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background: exceeded ? "#f87171" : "#34d399" }} />
        </div>
        <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", whiteSpace:"nowrap", color: exceeded ? "#ef4444" : "#6b7280" }}>
          {exceeded ? t("ticketsService.sla.exceeded", { h, m }) : t("ticketsService.sla.closed")}
        </span>
      </div>
    );
  }

  if (PAUSED.includes(status)) {
    const frozen = slaPauseElapsed != null ? slaPauseElapsed : Math.max(0, due - now);
    const pct = Math.min(100, Math.max(0, (frozen / win) * 100));
    const h = Math.floor(frozen / 3600000), m = Math.floor((frozen % 3600000) / 60000);
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
        <div style={{ height:3, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:"#a78bfa" }} />
        </div>
        <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", whiteSpace:"nowrap", color:"#7c3aed" }}>
          ⏸ {t("ticketsService.sla.frozen", { h, m })}
        </span>
      </div>
    );
  }

  const diffMs = due - now;
  const exceeded = diffMs <= 0;
  const pct = exceeded ? 100 : Math.max(0, Math.min(100, (Math.max(0, diffMs) / win) * 100));
  const abs = Math.abs(diffMs);
  const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
  const barColor = exceeded ? "#ef4444" : h < 2 ? "#f87171" : h < 6 ? "#fbbf24" : "#34d399";
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
      <div style={{ height:3, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:barColor }} />
      </div>
      <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", whiteSpace:"nowrap", color: exceeded ? "#ef4444" : h < 2 ? "#c2410c" : h < 6 ? "#a16207" : "#15803d" }}>
        {exceeded ? t("ticketsService.sla.alert", { h, m }) : t("ticketsService.sla.remaining", { h, m })}
      </span>
    </div>
  );
});

// ── Avatar ─────────────────────────────────────────────────────────────────
const Avatar = ({ name, surname, color="#dbeafe", textColor="#1d4ed8" }) => (
  <div style={{ width:24, height:24, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
    <span style={{ fontSize:8, fontWeight:900, color:textColor }}>
      {(name?.[0]||"").toUpperCase()}{(surname?.[0]||"").toUpperCase()}
    </span>
  </div>
);

// ── TabSwitch ──────────────────────────────────────────────────────────────
const TabSwitch = memo(({ activeTab, setActiveTab, actuelCount, archiveCount }) => {
  const { t } = useTranslation("technicien");
  const tabs = [
    { key:"actuels",  label: t("ticketsService.tabs.current"), Icon:HiOutlineTicket, count: actuelCount },
    { key:"archives", label: t("ticketsService.tabs.archives", { year: THIS_YEAR }), Icon:HiOutlineArchiveBox, count: archiveCount },
  ];
  return (
    <div style={{ display:"flex", borderBottom:"1.5px solid #e8e2d9", marginBottom:16 }}>
      {tabs.map(({ key, label, Icon, count }) => {
        const on = activeTab === key;
        return (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            display:"flex", alignItems:"center", gap:7,
            padding:"9px 18px", background:"none", border:"none", cursor:"pointer",
            fontSize:13, fontWeight: on ? 700 : 500,
            color: on ? "#0f172a" : "#94a3b8",
            borderBottom: on ? "2.5px solid #1d4ed8" : "2.5px solid transparent",
            marginBottom:"-1.5px", transition:"all 0.15s",
          }}>
            <Icon size={14} style={{ color: on ? "#1d4ed8" : "#c4bfb8" }} />
            {label}
            <span style={{
              background: on ? "#eff6ff" : "#f3f4f6",
              color: on ? "#1d4ed8" : "#94a3b8",
              borderRadius: 20,
              padding: "0 7px",
              fontSize: 11,
              fontWeight: 700
            }}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
});

// ── Filter primitives ──────────────────────────────────────────────────────
const FilterInput = ({ icon:Icon, placeholder, value, onChange }) => (
  <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
    {Icon && <Icon size={13} color="#94a3b8" style={{ position:"absolute", left:9, pointerEvents:"none" }} />}
    <input
      type="text" placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      style={{ border:"1px solid #e2e8f0", borderRadius:7, padding:"0 26px 0 28px", height:32, width:155, fontSize:12, color:"#1e293b", background:"#fff", outline:"none" }}
      onFocus={e => e.target.style.borderColor="#93c5fd"}
      onBlur={e  => e.target.style.borderColor="#e2e8f0"}
    />
    {value && (
      <button onClick={() => onChange("")} style={{ position:"absolute", right:7, background:"none", border:"none", cursor:"pointer", padding:0, display:"flex" }}>
        <HiOutlineXMark size={12} color="#94a3b8" />
      </button>
    )}
  </div>
);

const FilterSelect = ({ icon:Icon, value, onChange, minW=115, children }) => (
  <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
    {Icon && <Icon size={13} color="#94a3b8" style={{ position:"absolute", left:9, pointerEvents:"none", zIndex:1 }} />}
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      border:"1px solid #e2e8f0", borderRadius:7,
      padding: Icon ? "0 8px 0 28px" : "0 8px",
      height:32, fontSize:12, color: value ? "#1e293b" : "#94a3b8",
      background:"#fff", outline:"none", cursor:"pointer", appearance:"none", minWidth:minW,
    }}>
      {children}
    </select>
  </div>
);

const Sep = () => <div style={{ width:1, height:20, background:"#e8e2d9", flexShrink:0 }} />;

// ── TicketRow ──────────────────────────────────────────────────────────────
const TicketRow = memo(({ t, navigate, role, activeTab, isLast, ticketIds }) => {
  // FIX: two separate useTranslation calls — one per namespace, no array
  const { t: i18n } = useTranslation("technicien");
  const { t: tc }   = useTranslation("common");
  // FIX: locale-aware date formatter
  const fmtDate = makeFmtDate(tc("date.locale"));
  // FIX: translation helpers for Pill labels
  const tStatus   = (key) => tc(`status.${key}`,   { defaultValue: key });
  const tPriority = (key) => tc(`priority.${key}`, { defaultValue: key });
  const tCategory = (key) => tc(`category.${key}`, { defaultValue: key });

  const technician = t.assignedTo || t.users_tickets_assigned_toTousers || null;
  const empName  = t.employee ? `${t.employee.name||""} ${t.employee.surname||""}`.trim()||null : t.employee_name||null;
  const empParts = t.employee ? { name:t.employee.name, surname:t.employee.surname } : { name:empName?.split(" ")[0], surname:empName?.split(" ")[1] };
  const techName = technician && typeof technician === "object" ? `${technician.name||""} ${technician.surname||""}`.trim()||null : null;
  const lastDate = activeTab === "archives" ? fmtDate(t.closed_at) : fmtDate(t.assigned_at);

  const TD = ({ style, children }) => (
    <td style={{ padding:"9px 10px", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", ...style }}>{children}</td>
  );

  return (
    <tr
      onClick={() => {
        localStorage.setItem("ticketIds", JSON.stringify(ticketIds));
        navigate(`/${role}/tickets-service/${t.id}`, { state: { ticketIds } });
      }}
      style={{ background:"#fff", borderBottom: isLast ? "none" : "1px solid #f4f0ec", cursor:"pointer" }}
      onMouseOver={e => e.currentTarget.style.background="#faf8f5"}
      onMouseOut={e  => e.currentTarget.style.background="#fff"}
    >
      <TD style={{ fontWeight:700, color:"#c4bfb8", fontSize:11 }}>#{t.id}</TD>
      <td style={{ padding:"9px 10px", overflow:"hidden" }}>
        <span style={{ display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:12, fontWeight:600, color:"#0f172a" }}>
          {t.title || "N/A"}
        </span>
      </td>
      {/* FIX: pass translated label to Pill */}
      <TD><Pill config={CATEGORY_CONFIG} value={t.category||t.categorie} label={tCategory(t.category||t.categorie)} /></TD>
      <TD><Pill config={PRIORITY_CONFIG} value={t.priority} label={tPriority(t.priority)} /></TD>
      <TD><Pill config={STATUS_CONFIG}   value={t.status}   label={tStatus(t.status)}     /></TD>
      <td style={{ padding:"9px 10px" }}>
        {activeTab === "archives"
          ? <span style={{ color:"#d1d5db", fontSize:11 }}>—</span>
          : <SlaBar slaDueDate={t.sla_date_limite} slaDebut={t.sla_date_debut} status={t.status} closedAt={t.closed_at} slaPauseElapsed={t.sla_pause_elapsed_ms??null} />
        }
      </td>
      <TD>
        {empName ? (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <Avatar name={empParts.name} surname={empParts.surname} color="#fce7f3" textColor="#9d174d" />
            <span style={{ fontSize:12, color:"#374151", overflow:"hidden", textOverflow:"ellipsis" }}>{empName}</span>
          </div>
        ) : <span style={{ color:"#d1d5db" }}>—</span>}
      </TD>
      <TD>
        {techName ? (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <Avatar name={technician.name} surname={technician.surname} />
            <span style={{ fontSize:12, fontWeight:500, color:"#374151", overflow:"hidden", textOverflow:"ellipsis" }}>{techName}</span>
          </div>
        ) : <span style={{ fontSize:11, fontWeight:700, color:"#fb923c", fontStyle:"italic" }}>{i18n("ticketsService.row.unassigned")}</span>}
      </TD>
      <TD style={{ fontSize:11, color:"#94a3b8" }}>{fmtDate(t.created_at)}</TD>
      <TD style={{ fontSize:11, color:"#94a3b8" }}>{lastDate}</TD>
    </tr>
  );
});

const COLS = [
  { label:"ticketsService.table.id",         w:50  },
  { label:"ticketsService.table.title",       w:180 },
  { label:"ticketsService.table.category",    w:100 },
  { label:"ticketsService.table.priority",    w:90  },
  { label:"ticketsService.table.status",      w:121 },
  { label:"ticketsService.table.sla",         w:110 },
  { label:"ticketsService.table.employee",    w:140 },
  { label:"ticketsService.table.technician",  w:140 },
  { label:"ticketsService.table.createdAt",   w:95  },
  { label:null,                               w:95  },
];

// ── TicketTable ────────────────────────────────────────────────────────────
const TicketTable = memo(({ tickets, navigate, role, activeTab }) => {
  const { t } = useTranslation("technicien");
  const ticketIds = tickets.map(t => t.id);
  return (
    <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e8e2d9", overflow:"hidden" }}>
      {tickets.length === 0 ? (
        <div style={{ padding:"48px 24px", textAlign:"center" }}>
          <HiOutlineTicket size={32} color="#d1d5db" style={{ marginBottom:10 }} />
          <p style={{ color:"#94a3b8", fontSize:13, margin:0 }}>{t("ticketsService.empty")}</p>
        </div>
      ) : (
        <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"fixed" }}>
          <colgroup>{COLS.map((c,i) => <col key={i} style={{ width:c.w }} />)}</colgroup>
          <thead>
            <tr style={{ background:"#faf9f7", borderBottom:"1.5px solid #e8e2d9" }}>
              {COLS.map((c,i) => (
                <th key={i} style={{ padding:"9px 10px", fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px", whiteSpace:"nowrap", textAlign:"left" }}>
                  {c.label != null ? t(c.label) : (activeTab === "archives" ? t("ticketsService.table.closedAt") : t("ticketsService.table.assignedAt"))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t,idx) => (
              <TicketRow key={t.id} t={t} navigate={navigate} role={role} activeTab={activeTab} isLast={idx===tickets.length-1}
                ticketIds={ticketIds}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});

// ── Main ───────────────────────────────────────────────────────────────────
const TicketsServicePage = () => {
  const navigate = useNavigate();
  // FIX: two separate useTranslation — one per namespace, no array confusion
  const { t }   = useTranslation("technicien");
  const { t: tc } = useTranslation("common");
  // FIX: locale-aware helpers
  const dateLocale = tc("date.locale");
  const MONTHS_LOC = makeMonths(dateLocale);
  const tStatus   = (key) => tc(`status.${key}`,   { defaultValue: key });
  const tCategory = (key) => tc(`category.${key}`, { defaultValue: key });

  const { role, serviceId } = useMemo(() => {
    const u = JSON.parse(localStorage.getItem("user")||"null");
    return { role:u?.role||"", serviceId:u?.serviceId||u?.service_id||null };
  }, []);

  const [tickets,     setTickets]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [dbEnums,     setDbEnums]     = useState({ statuts:[], categories:[] });
  const [serviceName, setServiceName] = useState("");

  const [activeTab,        setActiveTab]        = useState("actuels");
  const [filterSearch,     setFilterSearch]     = useState("");
  const [filterStatus,     setFilterStatus]     = useState("");
  const [filterCategory,   setFilterCategory]   = useState("");
  const [filterAssignment, setFilterAssignment] = useState("");
  const [filterYear,       setFilterYear]       = useState("");
  const [filterMonth,      setFilterMonth]      = useState("");

  const debouncedSearch = useDebounce(filterSearch, 220);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const u = JSON.parse(localStorage.getItem("user")||"null");
      const userServiceId = u?.serviceId||u?.service_id;
      const [enumRes, ticketsRes] = await Promise.all([
        fetch("http://localhost:3001/api/tech/enums"),
        fetch("http://localhost:3001/api/tickets"),
      ]);
      const enumData = await enumRes.json();
      setDbEnums(enumData);
      if (!ticketsRes.ok) throw new Error("Erreur tickets");
      const allTickets = await ticketsRes.json();
      const filtered = userServiceId
        ? allTickets.filter(t => (t.serviceId||t.service_id) === userServiceId)
        : allTickets;
      setTickets(filtered);
      setServiceName(filtered[0]?.serviceName||"");
    } catch (err) {
      console.error("Erreur fetchData:", err);
    } finally {
      setLoading(false);
    }
  }, [serviceId, role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { actuelsList, archivesList, archiveYears } = useMemo(() => {
    const actuals=[], archives=[];
    const yearsSet = new Set();
    for (const t of tickets) {
      if (isArchived(t)) { archives.push(t); const y=getArchiveYear(t); if(y) yearsSet.add(y); }
      else actuals.push(t);
    }
    return { actuelsList:actuals, archivesList:archives, archiveYears:[...yearsSet].sort((a,b)=>b-a) };
  }, [tickets]);

 const filterList = useCallback((list, isArchive=false) => {
  const q = debouncedSearch.trim().toLowerCase();

  return list.filter(t => {
    const cat      = t.category || t.categorie || "";
    const assigned = !!(t.assignedTo || t.assigned_to || t.users_tickets_assigned_toTousers);

   const month = isArchive ? getMonth(t.closed_at) : getMonth(t.created_at);

    return (
      (!q                || String(t.id).includes(q) || (t.title||"").toLowerCase().includes(q)) &&
      (!filterStatus     || t.status === filterStatus) &&
      (!filterCategory   || cat === filterCategory) &&
      (!filterAssignment || (filterAssignment==="assigned" ? assigned : !assigned)) &&
      (!filterMonth      || month === parseInt(filterMonth)) &&
      (!isArchive        || !filterYear || getArchiveYear(t) === parseInt(filterYear))
    );
  });
}, [debouncedSearch, filterStatus, filterCategory, filterAssignment, filterYear, filterMonth]);
  const filteredActuels  = useMemo(() => filterList(actuelsList,  false), [filterList, actuelsList]);
  const filteredArchives = useMemo(() => filterList(archivesList, true),  [filterList, archivesList]);
  const displayedTickets = activeTab==="actuels" ? filteredActuels : filteredArchives;
  const sourceList       = activeTab==="actuels" ? actuelsList     : archivesList;

  const hasFilters = filterSearch||filterStatus||filterCategory||filterAssignment||filterYear||filterMonth;
  const resetFilters = useCallback(() => {
    setFilterSearch(""); setFilterStatus(""); setFilterCategory("");
    setFilterAssignment(""); setFilterYear(""); setFilterMonth("");
  }, []);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#faf9f7" }}>
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <div style={{ width:28, height:28, border:"2px solid #d9d4cc", borderTopColor:"#374151", borderRadius:"50%", animation:"_spin 0.8s linear infinite" }} />
        <span style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:2 }}>{t("ticketsService.loading")}</span>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", fontFamily:"sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom:"1px solid #e8e2d9", padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:0 }}>
            {serviceName
              ? <>{t("ticketsService.header.titlePrefix")} <span style={{ color:"#0f172a" }}>{serviceName}</span></>
              : t("ticketsService.header.titleFallback")}
          </h1>
          <p style={{ fontSize: 14, color: "#53575c", margin: 0, fontWeight: 530 }}>
            {role==="manager" ? t("ticketsService.header.subtitleManager") : t("ticketsService.header.subtitle")}
          </p>
        </div>
        <RefreshButton onRefresh={fetchData} />
      </div>

      {/* Body */}
      <div style={{ padding:"20px 28px" }}>

        <TabSwitch
          activeTab={activeTab}
          setActiveTab={tab => { setActiveTab(tab); if(tab!=="archives") setFilterYear(""); }}
          actuelCount={actuelsList.length}
          archiveCount={archivesList.length}
        />

        {/* Filters */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14, background:"#fff", border:"1px solid #e8e2d9", borderRadius:10, padding:"7px 12px", overflowX:"auto" }}>
          <FilterInput icon={HiOutlineMagnifyingGlass} placeholder={t("ticketsService.filters.searchPlaceholder")} value={filterSearch} onChange={setFilterSearch} />
          <Sep />
          {/* FIX: translated category options */}
          <FilterSelect icon={HiOutlineTag} value={filterCategory} onChange={setFilterCategory} minW={110}>
            <option value="">{t("ticketsService.filters.categoryAll")}</option>
            {dbEnums.categories?.map(c => <option key={c} value={c}>{tCategory(c)}</option>)}
          </FilterSelect>
          {/* FIX: translated status options */}
          <FilterSelect icon={HiOutlineExclamationCircle} value={filterStatus} onChange={setFilterStatus} minW={100}>
            <option value="">{t("ticketsService.filters.statusAll")}</option>
            {dbEnums.statuts?.map(s => <option key={s} value={s}>{tStatus(s)}</option>)}
          </FilterSelect>
          <FilterSelect icon={HiOutlineCheckCircle} value={filterAssignment} onChange={setFilterAssignment} minW={110}>
            <option value="">{t("ticketsService.filters.assignmentAll")}</option>
            <option value="assigned">{t("ticketsService.filters.assigned")}</option>
            <option value="unassigned">{t("ticketsService.filters.unassigned")}</option>
          </FilterSelect>
          {/* FIX: locale-aware month dropdown */}
          <FilterSelect icon={HiOutlineCalendarDays} value={filterMonth} onChange={setFilterMonth} minW={90}>
            <option value="">{t("ticketsService.filters.monthAll")}</option>
            {MONTHS_LOC.map((m,i) => <option key={i} value={i}>{m}</option>)}
          </FilterSelect>
          {activeTab==="archives" && archiveYears.length>0 && (
            <FilterSelect value={filterYear} onChange={setFilterYear} minW={75}>
              <option value="">{t("ticketsService.filters.closeYearAll")}</option>
              {archiveYears.map(y => <option key={y} value={y}>{y}</option>)}
            </FilterSelect>
          )}
          <Sep />
          <button onClick={resetFilters} style={{
            display:"flex", alignItems:"center", gap:5, height:32, padding:"0 11px", borderRadius:7, whiteSpace:"nowrap",
            border:`1px solid ${hasFilters ? "#fca5a5" : "#e2e8f0"}`,
            fontSize:12, fontWeight:600,
            color: hasFilters ? "#dc2626" : "#94a3b8",
            background: hasFilters ? "#fef2f2" : "#fff", cursor:"pointer", flexShrink:0,
          }}>
            <HiOutlineArrowPath size={12} />
            {t("ticketsService.filters.reset")}
          </button>
          <span style={{ marginLeft:"auto", fontSize:12, color:"#94a3b8", whiteSpace:"nowrap", flexShrink:0 }}>
            <span style={{ fontWeight:700, color:"#0f172a" }}>{displayedTickets.length}</span>
            {displayedTickets.length!==sourceList.length && <> / {sourceList.length}</>} ticket{displayedTickets.length!==1?"s":""}
          </span>
        </div>

        <TicketTable tickets={displayedTickets} navigate={navigate} role={role} activeTab={activeTab} />
      </div>
    </div>
  );
};

export default TicketsServicePage;