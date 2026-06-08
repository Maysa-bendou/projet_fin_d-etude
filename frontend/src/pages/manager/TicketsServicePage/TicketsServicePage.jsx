import React, {
  useState, useEffect, useMemo, useCallback, useRef, memo
} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HiOutlineTicket, HiOutlineArchiveBox, HiOutlineArrowPath,
  HiOutlineMagnifyingGlass, HiOutlineXMark,
  HiOutlineTag, HiOutlineExclamationCircle, HiOutlineCheckCircle,
  HiOutlineCalendarDays, HiOutlineArrowDownTray,
} from "react-icons/hi2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import RefreshButton from "../../../components/common/RefreshButton";
import { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG } from "../../../config/styles";
import Pill from "../../../components/common/Pill";
import * as XLSX from "xlsx";

// ── Constants ──────────────────────────────────────────────────────────────

const THIS_YEAR = new Date().getFullYear();


const makeFmtDate = (locale, longFormat) => (str) => {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  const day   = String(d.getDate());
  const month = d.toLocaleString(locale, { month: "short" });
  const year  = d.getFullYear();
  return (longFormat || "D MMMM YYYY")
    .replace("MMMM", month)
    .replace("D", day)
    .replace("YYYY", year);
};

// FIX: locale-aware month list for the filter dropdown
const makeMonths = (locale) =>
  Array.from({ length: 12 }, (_, i) =>
    new Date(2024, i, 1).toLocaleString(locale, { month: "long" })
  );

const getArchiveYear  = (t) => t.closed_at  ? new Date(t.closed_at).getFullYear()  : null;
const getMonth = (dateStr) => dateStr ? new Date(dateStr).getMonth() : null;

const isArchived = (t) => {
  if (t.status !== "closed") return false;
  const y = getArchiveYear(t);
  return y !== null && y < THIS_YEAR;
};

// ── Debounce hook ──────────────────────────────────────────────────────────

function useDebounce(value, delay = 220) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── SLA Bar ────────────────────────────────────────────────────────────────
// ── Working hours helper (Sun–Thu, 08:00–16:00) ───────────────────────────
function workingMsBetween(from, to) {
  const WORK_START = 8, WORK_END = 16;
  const WORK_DAYS  = new Set([0, 1, 2, 3, 4]);
  let ms = 0;
  let current = new Date(from);
  const end = new Date(to);
  while (current < end) {
    const day = current.getDay();
    if (WORK_DAYS.has(day)) {
      const dayStart = new Date(current); dayStart.setHours(WORK_START, 0, 0, 0);
      const dayEnd   = new Date(current); dayEnd.setHours(WORK_END,   0, 0, 0);
      const sliceFrom = current < dayStart ? dayStart : current;
      const sliceTo   = end < dayEnd ? end : dayEnd;
      if (sliceTo > sliceFrom) ms += sliceTo.getTime() - sliceFrom.getTime();
    }
    current.setDate(current.getDate() + 1);
    current.setHours(WORK_START, 0, 0, 0);
  }
  return ms;
}
// FIX: useTranslation("manager") — single namespace, NOT array
const SlaBar = memo(({ slaDueDate, slaDebut, status, closedAt, slaPauseElapsed }) => {
    const { t } = useTranslation("manager");
  const [, forceUpdate] = useState(0);  // ← ajoute ici
  useEffect(() => {                      // ← et ici
    const timer = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!slaDueDate)
    return <span style={{ color: "#94a3b8", fontSize: 11, fontStyle: "italic" }}>N/A</span>;

  const PAUSED   = ["pending", "pending_supplier"];
  const TERMINAL = ["resolved", "closed", "rejected"];
const now   = new Date();
const due   = new Date(slaDueDate);
const debut = new Date(slaDebut ?? (new Date(slaDueDate).getTime() - 86400000));
const win   = Math.max(1, workingMsBetween(debut, due));

  if (TERMINAL.includes(status)) {
const closed   = closedAt ? new Date(closedAt) : due;
const exceeded = closed > due;
const delta    = Math.abs(closed.getTime() - due.getTime());
const used     = workingMsBetween(debut, closed);
const pct      = Math.min(100, Math.max(0, (used / win) * 100));
    const h = Math.floor(delta / 3600000), m = Math.floor((delta % 3600000) / 60000);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ height: 3, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: exceeded ? "#ef4444" : "#16a34a" }} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap", color: exceeded ? "#ef4444" : "#6b7280" }}>
          {exceeded ? t("ticketsService.sla.exceeded", { h, m }) : t("ticketsService.sla.closed")}
        </span>
      </div>
    );
  }

  if (PAUSED.includes(status)) {
const frozen = slaPauseElapsed != null ? slaPauseElapsed : workingMsBetween(now, due);
const pct    = Math.min(100, Math.max(0, (frozen / win) * 100));
    const h = Math.floor(frozen / 3600000), m = Math.floor((frozen % 3600000) / 60000);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ height: 3, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#a78bfa" }} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap", color: "#7c3aed" }}>
          ⏸ {t("ticketsService.sla.frozen", { h, m })}
        </span>
      </div>
    );
  }

const remaining = due > now ? workingMsBetween(now, due) : 0;
const exceeded  = now > due;
const abs       = exceeded ? workingMsBetween(due, now) : remaining;
const used      = win - remaining;
const pct       = exceeded ? 100 : Math.max(0, Math.min(100, (used / win) * 100));
  const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
const barColor = exceeded ? "#ef4444" : pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ height: 3, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor }} />
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap", color: exceeded ? "#ef4444" : pct > 80 ? "#dc2626" : pct > 50 ? "#d97706" : "#15803d" }}>
        {exceeded ? t("ticketsService.sla.alert", { h, m }) : t("ticketsService.sla.remaining", { h, m })}
      </span>
    </div>
  );
});

// ── Avatar ─────────────────────────────────────────────────────────────────

const Avatar = ({ name, surname, color = "#dbeafe", textColor = "#1d4ed8" }) => (
  <div style={{ width: 22, height: 22, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <span style={{ fontSize: 8, fontWeight: 900, color: textColor }}>
      {(name?.[0] || "").toUpperCase()}{(surname?.[0] || "").toUpperCase()}
    </span>
  </div>
);

// ── TabSwitch ──────────────────────────────────────────────────────────────

const TabSwitch = memo(({ activeTab, setActiveTab, actuelCount, archiveCount }) => {
  const { t } = useTranslation("manager");
  const tabs = [
    { key: "actuels",  label: t("ticketsService.tabs.current"),                       Icon: HiOutlineTicket,     count: actuelCount  },
    { key: "archives", label: t("ticketsService.tabs.archives", { year: THIS_YEAR }), Icon: HiOutlineArchiveBox, count: archiveCount },
  ];
  return (
    <div style={{ display: "flex", borderBottom: "1.5px solid #e8e2d9", marginBottom: 16 }}>
      {tabs.map(({ key, label, Icon, count }) => {
        const on = activeTab === key;
        return (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 18px", background: "none", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: on ? 700 : 500,
            color: on ? "#0f172a" : "#94a3b8",
            borderBottom: on ? "2.5px solid #1d4ed8" : "2.5px solid transparent",
            marginBottom: "-1.5px", transition: "all 0.15s",
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

const FilterInput = ({ icon: Icon, placeholder, value, onChange }) => (
  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
    {Icon && <Icon size={13} color="#94a3b8" style={{ position: "absolute", left: 9, pointerEvents: "none" }} />}
    <input
      type="text" placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: "0 26px 0 28px", height: 32, width: 155, fontSize: 12, color: "#1e293b", background: "#fff", outline: "none" }}
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

// ── TicketRow ──────────────────────────────────────────────────────────────

const TicketRow = memo(({ ticket, navigate, role, activeTab, isLast, ticketIds }) => {
  // FIX: two separate useTranslation calls — one per namespace, no array
  const { t }    = useTranslation("manager");
  const { t: tc } = useTranslation("common");
// AFTER
const fmtDate = makeFmtDate(tc("date.locale"), tc("date.long"));
  // FIX: translation helpers for Pill labels
  const tStatus   = (key) => tc(`status.${key}`,   { defaultValue: key });
  const tPriority = (key) => tc(`priority.${key}`, { defaultValue: key });
  const tCategory = (key) => tc(`category.${key}`, { defaultValue: key });

  const technician = ticket.assignedTo || ticket.assigned_to || ticket.user_ticket_assigned_toTouser;
  const empName  = ticket.employee ? `${ticket.employee.name || ""} ${ticket.employee.surname || ""}`.trim() : null;
  const empParts = ticket.employee
    ? { name: ticket.employee.name, surname: ticket.employee.surname }
    : { name: empName?.split(" ")[0], surname: empName?.split(" ")[1] };
  const techName = technician ? `${technician.name || ""} ${technician.surname || ""}`.trim() : null;
  const lastDate = activeTab === "archives" ? fmtDate(ticket.closed_at) : fmtDate(ticket.assigned_at);

  const TD = ({ style, children }) => (
    <td style={{ padding: "9px 10px", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...style }}>{children}</td>
  );

  return (
    <tr
      onClick={() => {
        localStorage.setItem("ticketIds", JSON.stringify(ticketIds));
        navigate(`/${role}/tickets-service/${ticket.id}`, { state: { ticketIds } });
      }}
      style={{ background: "#fff", borderBottom: isLast ? "none" : "1px solid #f4f0ec", cursor: "pointer" }}
      onMouseOver={e => e.currentTarget.style.background = "#faf8f5"}
      onMouseOut={e  => e.currentTarget.style.background = "#fff"}
    >
      <TD style={{ fontWeight: 700, color: "#c4bfb8", fontSize: 11 }}>#{ticket.id}</TD>

      <td style={{ padding: "9px 10px", overflow: "hidden" }}>
        <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0f172a", wordBreak: "break-word", whiteSpace: "normal" }}>
          {ticket.title || "N/A"}
        </span>
      </td>

      {/* FIX: pass translated label to Pill */}
      <TD><Pill config={CATEGORY_CONFIG} value={ticket.category || ticket.categorie} label={tCategory(ticket.category || ticket.categorie)} /></TD>
      <TD><Pill config={PRIORITY_CONFIG} value={ticket.priority}                     label={tPriority(ticket.priority)} /></TD>
      <TD><Pill config={STATUS_CONFIG}   value={ticket.status}                       label={tStatus(ticket.status)} /></TD>

    <td style={{ padding: "9px 10px" }}>
  <SlaBar
    slaDueDate={ticket.sla_date_limite}
    slaDebut={ticket.sla_date_debut}
    status={ticket.status}
    closedAt={ticket.closed_at}
    slaPauseElapsed={ticket.sla_pause_elapsed_ms ?? null}
  />
</td>

      <TD style={{ whiteSpace: "nowrap" }}>
        {empName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Avatar name={empParts.name} surname={empParts.surname} color="#fce7f3" textColor="#9d174d" />
            <span style={{ fontSize: 12, color: "#374151" }}>{empName}</span>
          </div>
        ) : <span style={{ color: "#d1d5db" }}>—</span>}
      </TD>

      <TD style={{ whiteSpace: "nowrap" }}>
        {techName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Avatar name={technician.name} surname={technician.surname} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{techName}</span>
          </div>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fb923c", fontStyle: "italic" }}>
            {t("ticketsService.unassigned")}
          </span>
        )}
      </TD>

      <TD style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(ticket.created_at)}</TD>
      <TD style={{ fontSize: 11, color: "#94a3b8" }}>{lastDate}</TD>
    </tr>
  );
});

// ── TicketTable ────────────────────────────────────────────────────────────

const COLS = [
  { label: "ticketsService.cols.id",         w: 50,  minW: 50  },
  { label: "ticketsService.cols.title",       w: 180, minW: 180 },
  { label: "ticketsService.cols.category",    w: 100, minW: 100 },
  { label: "ticketsService.cols.priority",    w: 90,  minW: 90  },
  { label: "ticketsService.cols.status",      w: 121, minW: 121 },
  { label: "ticketsService.cols.sla",         w: 110, minW: 110 },
  { label: "ticketsService.cols.employee",    w: 140, minW: 140 },
  { label: "ticketsService.cols.technician",  w: 140, minW: 140 },
  { label: "ticketsService.cols.createdAt",   w: 95,  minW: 95  },
  { label: null,                              w: 95,  minW: 95  },
];
const TicketTable = memo(({ tickets, navigate, role, activeTab }) => {
  const { t } = useTranslation("manager");
  const ticketIds = tickets.map(tk => tk.id);
  return (
   <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e2d9", overflow: "hidden" }}>
      {tickets.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <HiOutlineTicket size={32} color="#d1d5db" style={{ marginBottom: 10 }} />
          <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>{t("ticketsService.noTickets")}</p>
        </div>
      ) : (
        <div>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
    <colgroup>{COLS.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>

            <thead>
              <tr style={{ background: "#faf9f7", borderBottom: "1.5px solid #e8e2d9" }}>
                {COLS.map((c, i) => (
                  <th key={i} style={{ padding: "9px 10px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", textAlign: "left" }}>
                    {c.label != null
                      ? t(c.label)
                      : (activeTab === "archives" ? t("ticketsService.cols.closedAt") : t("ticketsService.cols.assignedAt"))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((tk, idx) => (
                <TicketRow
                  key={tk.id}
                  ticket={tk}
                  navigate={navigate}
                  role={role}
                  activeTab={activeTab}
                  isLast={idx === tickets.length - 1}
                  ticketIds={ticketIds}
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
  // FIX: two separate useTranslation calls — one per namespace, no array
  const { t }    = useTranslation("manager");
  const { t: tc } = useTranslation("common");
  // FIX: locale-aware helpers derived from the active language
  const dateLocale = tc("date.locale");
  const MONTHS_LOC = makeMonths(dateLocale);
  const tStatus   = (key) => tc(`status.${key}`,   { defaultValue: key });
  const tCategory = (key) => tc(`category.${key}`, { defaultValue: key });

  const tableRef = useRef(null);
  const [exporting, setExporting] = useState(false);

const { role, serviceId, managerName } = useMemo(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    const fullName = u ? `${u.name || ""} ${u.surname || ""}`.trim() : "";
    return {
      role:        u?.role || "",
      serviceId:   u?.serviceId || u?.service_id || null,
      managerName: fullName || u?.username || u?.email || "",
    };
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
  const [filterMonth,      setFilterMonth]      = useState("");

  const debouncedSearch = useDebounce(filterSearch, 220);

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [enumRes, ticketsRes] = await Promise.all([
        fetch("https://ticket-backend-4uw2.onrender.com/api/tech/enums"),
        fetch("https://ticket-backend-4uw2.onrender.com/api/tickets"),
      ]);

      const enumData = await enumRes.json();
      setDbEnums(enumData);

      if (!ticketsRes.ok) throw new Error("Erreur tickets");
      const allTickets = await ticketsRes.json();

      const filtered = serviceId
        ? allTickets.filter(tk => (tk.serviceId || tk.service_id) === serviceId)
        : allTickets;

      setTickets(filtered);
      setServiceName(filtered[0]?.serviceName || filtered[0]?.service?.name || "");
    } catch (err) {
      console.error("Erreur fetchData:", err);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Partition ──────────────────────────────────────────────────────────

  const { actuelsList, archivesList, archiveYears } = useMemo(() => {
    const actuals = [], archives = [];
    const yearsSet = new Set();
    for (const tk of tickets) {
      if (isArchived(tk)) {
        archives.push(tk);
        const y = getArchiveYear(tk);
        if (y) yearsSet.add(y);
      } else {
        actuals.push(tk);
      }
    }
    return { actuelsList: actuals, archivesList: archives, archiveYears: [...yearsSet].sort((a, b) => b - a) };
  }, [tickets]);

  // ── Filter ─────────────────────────────────────────────────────────────

  const filterList = useCallback((list, isArchive = false) => {
    const q = debouncedSearch.trim().toLowerCase();
    return list.filter(tk => {
      const cat      = tk.category || tk.categorie || "";
      const assigned = !!(tk.assignedTo || tk.assigned_to || tk.assignee);
      const month    = isArchive ? getMonth(tk.closed_at) : getMonth(tk.created_at);
      return (
        (!q                || String(tk.id).includes(q) || (tk.title || "").toLowerCase().includes(q)) &&
        (!filterStatus     || tk.status === filterStatus) &&
        (!filterCategory   || cat === filterCategory) &&
        (!filterAssignment || (filterAssignment === "assigned" ? assigned : !assigned)) &&
        (!filterMonth      || month === parseInt(filterMonth)) &&
        (!isArchive        || !filterYear || getArchiveYear(tk) === parseInt(filterYear))
      );
    });
  }, [debouncedSearch, filterStatus, filterCategory, filterAssignment, filterYear, filterMonth]);

  const filteredActuels  = useMemo(() => filterList(actuelsList,  false), [filterList, actuelsList]);
  const filteredArchives = useMemo(() => filterList(archivesList, true),  [filterList, archivesList]);

  const displayedTickets = activeTab === "actuels" ? filteredActuels : filteredArchives;
  const sourceList       = activeTab === "actuels" ? actuelsList     : archivesList;

  const hasFilters = filterSearch || filterStatus || filterCategory || filterAssignment || filterYear || filterMonth;
  const resetFilters = useCallback(() => {
    setFilterSearch(""); setFilterStatus(""); setFilterCategory("");
    setFilterAssignment(""); setFilterYear(""); setFilterMonth("");
  }, []);

  // ── Export PDF ─────────────────────────────────────────────────────────
const exportPDF = useCallback(async () => {
    if (!tableRef.current) return;
    setExporting(true);
    try {
      const wrapperEl = tableRef.current;

      // ── 1. Deep-clone the table into a hidden off-screen container
      const offscreen = document.createElement("div");
      offscreen.style.cssText = [
        "position:fixed",
        "top:0",
        "left:-99999px",
        "width:max-content",
        "min-width:100vw",
        "background:#ffffff",
        "z-index:-1",
        "pointer-events:none",
        "overflow:visible",
      ].join(";");

      const clone = wrapperEl.cloneNode(true);
      clone.style.overflow     = "visible";
      clone.style.overflowX    = "visible";
      clone.style.overflowY    = "visible";
      clone.style.width        = "max-content";
      clone.style.minWidth     = "unset";
      clone.style.maxWidth     = "unset";
      clone.style.borderRadius = "0";

      clone.querySelectorAll("*").forEach(child => {
        const cs = window.getComputedStyle(child);
        if (cs.overflowX === "auto" || cs.overflowX === "scroll" || cs.overflowX === "hidden") {
          child.style.overflowX = "visible";
          child.style.width     = "max-content";
        }
        if (cs.overflowY === "auto" || cs.overflowY === "scroll" || cs.overflowY === "hidden") {
          child.style.overflowY = "visible";
        }
      });

      clone.querySelectorAll("table").forEach(tbl => {
        tbl.style.width       = "max-content";
        tbl.style.minWidth    = "100%";
        tbl.style.tableLayout = "auto";
      });
      clone.querySelectorAll("col").forEach((col, i) => {
        if (COLS[i]) col.style.minWidth = COLS[i].minW + "px";
      });

      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const fullW = offscreen.scrollWidth;
      const fullH = offscreen.scrollHeight;

      // ── 2. Capture the off-screen clone
      const canvas = await html2canvas(offscreen, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth:  fullW,
        windowHeight: fullH,
        width:  fullW,
        height: fullH,
        x: 0,
        y: 0,
      });

      // ── 3. Get row boundaries from the clone
      const cloneRect = clone.getBoundingClientRect();
      const allRows   = Array.from(clone.querySelectorAll("thead tr, tbody tr"));
      const rowBands  = allRows.map(row => {
        const r = row.getBoundingClientRect();
        return {
          top:    r.top    - cloneRect.top,
          bottom: r.bottom - cloneRect.top,
        };
      });

      // ── 4. Remove the off-screen clone
      document.body.removeChild(offscreen);

// ── 5. Draw logo with jsPDF shapes (no image)
      const logoW = 28;
      const logoH = 18;

      // ── 6. Build the PDF
      const margin  = 24;
      const headerH = 55;
      const pdf     = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
      const pdfW    = pdf.internal.pageSize.getWidth();
      const pdfH    = pdf.internal.pageSize.getHeight();
      const usableW = pdfW - margin * 2;
      const usableH = pdfH - margin * 2 - headerH;

      const imgW  = canvas.width / 2;
      const ratio = usableW / imgW;

      const totalPages = (() => {
        let curY = 0; let pages = 1;
        for (const band of rowBands) {
          const h = (band.bottom - band.top) * ratio;
          if (curY + h > usableH && curY > 0) { pages++; curY = 0; }
          curY += h;
        }
        return pages;
      })();

      const drawHeader = (pNum) => {
        // ── Logo (top-left, correct aspect ratio)
// Triangle rouge Djezzy
pdf.setFillColor(255, 1, 19);
pdf.setDrawColor(255, 1, 19);
// Scaled smaller (26×26) to fit the compact header of this page
// SVG M15,85 L85,50 L15,15 → scale 26/100=0.26, offset x=margin, y=margin-4
pdf.triangle(margin + 3.9, margin - 0.1,  margin + 3.9, margin + 18.1,  margin + 22.1, margin + 9, 'FD');
pdf.setFontSize(6);
pdf.setFont(undefined, 'bold');
pdf.setTextColor(255, 255, 255);
pdf.text('DJEZZY', margin + 5, margin + 6);
pdf.text('\u062C\u0627\u0632\u06CC', margin + 6, margin + 13);

        // ── Line 1: title (indented past logo) + ticket count (right)
        pdf.setFontSize(13);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont(undefined, "bold");
        const title = serviceName
          ? `${t("ticketsService.service")} ${serviceName}`
          : t("ticketsService.allTickets");
        const titleX = margin + 38;
        pdf.text(title, titleX, margin + 10);
        pdf.text(
          `${displayedTickets.length} ticket${displayedTickets.length !== 1 ? "s" : ""}${totalPages > 1 ? `  ${pNum}/${totalPages}` : ""}`,
          pdfW - margin, margin + 10, { align: "right" }
        );

        // ── Separator line (black, sits below logo + title)
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.line(margin, margin + 22, pdfW - margin, margin + 22);

        // ── Line 2: Exported by + Date
        pdf.setFontSize(8.5);
        pdf.setFont(undefined, "normal");
        pdf.setTextColor(100, 116, 139);
        const exportedAt = new Date().toLocaleString(dateLocale, {
          day: "numeric", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        });
        pdf.text(`${t("ticketsService.exportedBy")}: ${managerName || "—"}`, margin, margin + 30);
        pdf.text(`Date: ${exportedAt}`, pdfW - margin, margin + 30, { align: "right" });

        // ── Line 3: Active filters evenly spaced
        const filters = [];
        if (filterStatus)     filters.push(`${t("ticketsService.cols.status")}: ${tStatus(filterStatus)}`);
        if (filterCategory)   filters.push(`${t("ticketsService.cols.category")}: ${tCategory(filterCategory)}`);
        if (filterAssignment) filters.push(`${t("ticketsService.cols.technician")}: ${filterAssignment === "assigned" ? t("ticketsService.filters.assigned") : t("ticketsService.filters.unassigned")}`);
        if (filterMonth)      filters.push(`Month: ${MONTHS_LOC[parseInt(filterMonth)]}`);

        if (filters.length > 0) {
          const step = (pdfW - margin * 2) / filters.length;
          filters.forEach((f, i) => {
            pdf.text(f, margin + i * step, margin + 42);
          });
        }
      };

      drawHeader(1);

      let cursorY = 0;
      let pageNum = 1;

      for (const band of rowBands) {
        const rowH       = band.bottom - band.top;
        const rowHScaled = rowH * ratio;

        if (cursorY > 0 && cursorY * ratio + rowHScaled > usableH) {
          pdf.addPage();
          pageNum++;
          drawHeader(pageNum);
          cursorY = 0;
        }

        const sliceCanvas  = document.createElement("canvas");
        sliceCanvas.width  = canvas.width;
        sliceCanvas.height = Math.ceil(rowH * 2);
        const ctx = sliceCanvas.getContext("2d");
        ctx.drawImage(
          canvas,
          0, Math.floor(band.top * 2),
          canvas.width, Math.ceil(rowH * 2),
          0, 0,
          canvas.width, Math.ceil(rowH * 2)
        );

        const destY = margin + headerH + cursorY * ratio;
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, destY, usableW, rowHScaled);
        cursorY += rowH;
      }

      const blob = pdf.output("blob");
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `tickets_export_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);

    } catch (err) {
      console.error("PDF export error:", err);
      document.querySelectorAll("div[style*='-99999px']").forEach(n => n.remove());
    } finally {
      setExporting(false);
    }
  }, [tableRef, displayedTickets, serviceName, filterStatus, filterCategory, filterAssignment, filterMonth, filterYear, filterSearch, MONTHS_LOC, t, tc, tStatus, tCategory, managerName, dateLocale]);
  
    // ── Export Excel ─────────────────────────────────────────────────────────
  const exportExcel = useCallback(() => {
  if (!displayedTickets.length) return;

  const fmtDate = makeFmtDate(dateLocale, tc("date.long"));

  const rows = displayedTickets.map(tk => {
    const technician = tk.assignedTo || tk.assigned_to || tk.user_ticket_assigned_toTouser;
    const empName  = tk.employee
      ? `${tk.employee.name || ""} ${tk.employee.surname || ""}`.trim()
      : null;
    const techName = technician
      ? `${technician.name || ""} ${technician.surname || ""}`.trim()
      : t("ticketsService.unassigned");
    const lastDateLabel = activeTab === "archives"
      ? t("ticketsService.cols.closedAt")
      : t("ticketsService.cols.assignedAt");
    const lastDateValue = activeTab === "archives"
      ? fmtDate(tk.closed_at)
      : fmtDate(tk.assigned_at);

    return {
      [t("ticketsService.cols.id")]:         `#${tk.id}`,
      [t("ticketsService.cols.title")]:       tk.title || "N/A",
      [t("ticketsService.cols.category")]:    tCategory(tk.category || tk.categorie),
      [t("ticketsService.cols.priority")]:    tc(`priority.${tk.priority}`, { defaultValue: tk.priority }),
      [t("ticketsService.cols.status")]:      tStatus(tk.status),
     [t("ticketsService.cols.sla")]: (() => {
  if (!tk.sla_date_limite) return "N/A";
  const PAUSED   = ["pending", "pending_supplier"];
  const TERMINAL = ["resolved", "closed", "rejected"];
const now   = new Date();
const due   = new Date(tk.sla_date_limite);
const debut = new Date(tk.sla_date_debut ?? (due.getTime() - 86400000));
const win   = Math.max(1, workingMsBetween(debut, due));

  if (TERMINAL.includes(tk.status)) {
const closed   = tk.closed_at ? new Date(tk.closed_at) : due;
const exceeded = closed > due;
if (!exceeded) return "CLOSED ✓";
const delta = Math.abs(closed.getTime() - due.getTime());
    const h = Math.floor(delta / 3600000);
    const m = Math.floor((delta % 3600000) / 60000);
    return `+${h}H ${m}M EXCEEDED`;
  }

  if (PAUSED.includes(tk.status)) {
const frozen = tk.sla_pause_elapsed_ms != null ? tk.sla_pause_elapsed_ms : workingMsBetween(now, due);
    const h = Math.floor(frozen / 3600000);
    const m = Math.floor((frozen % 3600000) / 60000);
    return `${h}H ${m}M FROZEN`;
  }

const remaining = due > now ? workingMsBetween(now, due) : 0;
const exceeded  = now > due;
const abs       = exceeded ? workingMsBetween(due, now) : remaining;
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  return exceeded ? `+${h}H ${m}M EXCEEDED` : `${h}H ${m}M REMAINING`;
})(),
      [t("ticketsService.cols.employee")]:    empName  || "—",
      [t("ticketsService.cols.technician")]:  techName || "—",
      [t("ticketsService.cols.createdAt")]:   fmtDate(tk.created_at),
      [lastDateLabel]:                        lastDateValue,
    };
  });

const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths to content
  const colKeys = Object.keys(rows[0]);
  ws["!cols"] = colKeys.map(key => {
    const maxLen = Math.max(
      key.length,
      ...rows.map(r => String(r[key] ?? "").length)
    );
    return { wch: maxLen + 2 };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tickets");
  XLSX.writeFile(wb, `tickets_export_${Date.now()}.xlsx`);
  
}, [displayedTickets, activeTab, t, tc, tStatus, tCategory, dateLocale]);
  
  
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#faf9f7" }}>
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 28, height: 28, border: "2px solid #d9d4cc", borderTopColor: "#374151", borderRadius: "50%", animation: "_spin 0.8s linear infinite" }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 2 }}>
          {t("ticketsService.loading")}
        </span>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #e8e2d9", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 750, color: "#0f172a", margin: 0 }}>
              {serviceName
                ? <>{t("ticketsService.service")} <span style={{ color: "#0f172a" }}>{serviceName}</span></>
                : t("ticketsService.allTickets")}
            </h1>
            <p style={{ fontSize: 14, fontWeight: 530, color: "#3a424c", margin: "0px" }}>
              {role === "manager" ? t("ticketsService.headerManage") : t("ticketsService.headerService")}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={exportPDF}
            disabled={exporting || displayedTickets.length === 0}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8, border: "1.5px solid #bfdbfe",
              background: exporting ? "#f1f5f9" : "#eff6ff",
              color: exporting ? "#94a3b8" : "#1d4ed8",
              fontSize: 12, fontWeight: 600, cursor: exporting ? "not-allowed" : "pointer",
              opacity: displayedTickets.length === 0 ? 0.45 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <HiOutlineArrowDownTray size={15} />
            {exporting ? "Export…" : "Export PDF"}
          </button>
          
          <button
  onClick={exportExcel}
  disabled={displayedTickets.length === 0}
  style={{
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 14px", borderRadius: 8, border: "1.5px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#15803d",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
    opacity: displayedTickets.length === 0 ? 0.45 : 1,
    transition: "opacity 0.15s",
  }}
>
  <HiOutlineArrowDownTray size={15} />
  Export Excel
</button>

          <RefreshButton onRefresh={fetchData} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 28px" }}>

        {/* Tabs */}
        <TabSwitch
          activeTab={activeTab}
          setActiveTab={tab => { setActiveTab(tab); if (tab !== "archives") setFilterYear(""); }}
          actuelCount={actuelsList.length}
          archiveCount={archivesList.length}
        />

        {/* Filters — single row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, background: "#fff", border: "1px solid #e8e2d9", borderRadius: 10, padding: "7px 12px", overflowX: "auto" }}>
          <FilterInput
            icon={HiOutlineMagnifyingGlass}
            placeholder={t("ticketsService.filters.searchPlaceholder")}
            value={filterSearch}
            onChange={setFilterSearch}
          />
          <Sep />
          {/* FIX: translated category options from common namespace */}
          <FilterSelect icon={HiOutlineTag} value={filterCategory} onChange={setFilterCategory} minW={110}>
            <option value="">{t("ticketsService.filters.allCategories")}</option>
            {dbEnums.categories?.map(c => <option key={c} value={c}>{tCategory(c)}</option>)}
          </FilterSelect>
          {/* FIX: translated status options from common namespace */}
          <FilterSelect icon={HiOutlineExclamationCircle} value={filterStatus} onChange={setFilterStatus} minW={100}>
            <option value="">{t("ticketsService.filters.allStatuses")}</option>
            {dbEnums.statuts?.map(s => <option key={s} value={s}>{tStatus(s)}</option>)}
          </FilterSelect>
          <FilterSelect icon={HiOutlineCheckCircle} value={filterAssignment} onChange={setFilterAssignment} minW={110}>
            <option value="">{t("ticketsService.filters.all")}</option>
            <option value="assigned">{t("ticketsService.filters.assigned")}</option>
            <option value="unassigned">{t("ticketsService.filters.unassigned")}</option>
          </FilterSelect>
          {/* FIX: locale-aware month dropdown */}
          <FilterSelect icon={HiOutlineCalendarDays} value={filterMonth} onChange={setFilterMonth} minW={90}>
            <option value="">{t("ticketsService.filters.monthAll")}</option>
            {MONTHS_LOC.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </FilterSelect>
{activeTab === "archives" && archiveYears.length > 0 && (
  <FilterSelect value={filterYear} onChange={setFilterYear} minW={75}>
    <option value="">{t("ticketsService.filters.allYears")}</option>
    {archiveYears.map(y => <option key={y} value={y}>{y}</option>)}
  </FilterSelect>
)}
          <Sep />
          <button onClick={resetFilters} style={{
            display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 11px", borderRadius: 7, whiteSpace: "nowrap",
            border: `1px solid ${hasFilters ? "#fca5a5" : "#e2e8f0"}`,
            fontSize: 12, fontWeight: 600,
            color: hasFilters ? "#dc2626" : "#94a3b8",
            background: hasFilters ? "#fef2f2" : "#fff", cursor: "pointer", flexShrink: 0,
          }}>
            <HiOutlineArrowPath size={12} />
            {t("ticketsService.filters.reset")}
          </button>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>{displayedTickets.length}</span>
            {displayedTickets.length !== sourceList.length && <> / {sourceList.length}</>} ticket{displayedTickets.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div ref={tableRef}>
          <TicketTable tickets={displayedTickets} navigate={navigate} role={role} activeTab={activeTab} />
        </div>

      </div>
    </div>
  );
};

export default TicketsServicePage;
