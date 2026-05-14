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

// ── Constants ──────────────────────────────────────────────────────────────

const THIS_YEAR = new Date().getFullYear();


const makeFmtDate = (locale, longFormat) => (str) => {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  const day   = String(d.getDate());
  const month = d.toLocaleString(locale, { month: "long" });
  const year  = d.getFullYear();
  return (longFormat || "D MMMM YYYY")
    .replace("MMMM", month)
    .replace("D", day)
    .replace("YYYY", year);
};

// FIX: locale-aware month list for the filter dropdown
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
// FIX: useTranslation("manager") — single namespace, NOT array
const SlaBar = memo(({ slaDueDate, slaDebut, status, closedAt, slaPauseElapsed }) => {
  const { t } = useTranslation("manager");

  if (!slaDueDate)
    return <span style={{ color: "#94a3b8", fontSize: 11, fontStyle: "italic" }}>N/A</span>;

  const PAUSED   = ["pending", "pending_supplier"];
  const TERMINAL = ["resolved", "closed", "rejected"];
  const now      = Date.now();
  const due      = new Date(slaDueDate).getTime();
  const debut    = slaDebut ? new Date(slaDebut).getTime() : due - 86400000;
  const win      = due - debut;

  if (TERMINAL.includes(status)) {
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
          {exceeded ? t("ticketsService.sla.exceeded", { h, m }) : t("ticketsService.sla.closed")}
        </span>
      </div>
    );
  }

  if (PAUSED.includes(status)) {
const frozen = slaPauseElapsed != null ? slaPauseElapsed : Math.max(0, due - now);
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

  const diffMs   = due - now;
  const exceeded = diffMs <= 0;
  const pct = exceeded ? 100 : Math.max(0, Math.min(100, (Math.max(0, diffMs) / win) * 100));
  const abs      = Math.abs(diffMs);
  const h = Math.floor(abs / 3600000), m = Math.floor((abs % 3600000) / 60000);
  const barColor = exceeded ? "#ef4444" : h < 2 ? "#f87171" : h < 6 ? "#fbbf24" : "#34d399";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ height: 3, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor }} />
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap", color: exceeded ? "#ef4444" : h < 2 ? "#c2410c" : h < 6 ? "#a16207" : "#15803d" }}>
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

  const technician = ticket.assignedTo || ticket.assigned_to || ticket.users_tickets_assigned_toTousers;
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
  { label: "ticketsService.cols.id",         w: 50  },
  { label: "ticketsService.cols.title",       w: 180 },
  { label: "ticketsService.cols.category",    w: 100 },
  { label: "ticketsService.cols.priority",    w: 90  },
  { label: "ticketsService.cols.status",      w: 121 },
  { label: "ticketsService.cols.sla",         w: 110 },
  { label: "ticketsService.cols.employee",    w: 140 },
  { label: "ticketsService.cols.technician",  w: 140 },
  { label: "ticketsService.cols.createdAt",   w: 95  },
  { label: null,                              w: 95  },
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
  const [filterMonth,      setFilterMonth]      = useState("");

  const debouncedSearch = useDebounce(filterSearch, 220);

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [enumRes, ticketsRes] = await Promise.all([
        fetch("http://localhost:3001/api/tech/enums"),
        fetch("http://localhost:3001/api/tickets"),
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
      const assigned = !!(tk.assignedTo || tk.assigned_to || tk.users_tickets_assigned_toTousers);
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
      //       that has NO width constraint → browser lays it out at full
      //       natural width so every column (incl. ASSIGNED) is rendered.
      const offscreen = document.createElement("div");
      offscreen.style.cssText = [
        "position:fixed",
        "top:0",
        "left:-99999px",        // off-screen, not clipped
        "width:max-content",    // expand to fit all columns
        "min-width:100vw",
        "background:#ffffff",
        "z-index:-1",
        "pointer-events:none",
        "overflow:visible",
      ].join(";");

      const clone = wrapperEl.cloneNode(true);
      // Remove any overflow/width constraints from the clone itself
      clone.style.overflow  = "visible";
      clone.style.overflowX = "visible";
      clone.style.overflowY = "visible";
      clone.style.width     = "max-content";
      clone.style.minWidth  = "unset";
      clone.style.maxWidth  = "unset";
      clone.style.borderRadius = "0";

      // Also remove scroll containers inside the clone
      clone.querySelectorAll("*").forEach(child => {
        const cs = window.getComputedStyle(child);
        if (cs.overflowX === "auto" || cs.overflowX === "scroll" ||
            cs.overflowX === "hidden") {
          child.style.overflowX = "visible";
          child.style.width     = "max-content";
        }
        if (cs.overflowY === "auto" || cs.overflowY === "scroll" ||
            cs.overflowY === "hidden") {
          child.style.overflowY = "visible";
        }
      });

      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      // Wait one frame for the browser to paint the clone at full width
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const fullW = offscreen.scrollWidth;
      const fullH = offscreen.scrollHeight;

      // ── 2. Capture the off-screen clone (no viewport clipping)
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

      // ── 3. Get row boundaries from the CLONE (not the live DOM)
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

      // ── 5. Build the PDF
      const margin  = 24;
      const headerH = 32;
      const pdf     = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
      const pdfW    = pdf.internal.pageSize.getWidth();
      const pdfH    = pdf.internal.pageSize.getHeight();
      const usableW = pdfW - margin * 2;
      const usableH = pdfH - margin * 2 - headerH;

      // Scale factor: canvas pixels → PDF px  (canvas is scale:2)
      const imgW  = canvas.width / 2;
      const ratio = usableW / imgW;

      const activeFilters = [];
      if (filterStatus)     activeFilters.push(tStatus(filterStatus));
      if (filterCategory)   activeFilters.push(tCategory(filterCategory));
      if (filterAssignment) activeFilters.push(filterAssignment === "assigned" ? t("ticketsService.filters.assigned") : t("ticketsService.filters.unassigned"));
      if (filterMonth)      activeFilters.push(MONTHS_LOC[parseInt(filterMonth)]);
      if (filterYear)       activeFilters.push(String(filterYear));
      if (filterSearch)     activeFilters.push(`"${filterSearch}"`);
      const filterText = activeFilters.length ? activeFilters.join(" · ") : "—";

      let pageNum = 1;
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
        pdf.setFontSize(13);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont(undefined, "bold");
        const title = serviceName
          ? `${t("ticketsService.service")} ${serviceName}`
          : t("ticketsService.allTickets");
        pdf.text(title, margin, margin + 4);
        pdf.setFontSize(8.5);
        pdf.setFont(undefined, "normal");
        pdf.setTextColor(100, 116, 139);
        pdf.text(filterText, margin, margin + 16);
        pdf.text(
          `${displayedTickets.length} ticket${displayedTickets.length !== 1 ? "s" : ""}${totalPages > 1 ? `   ${pNum}/${totalPages}` : ""}`,
          pdfW - margin, margin + 4, { align: "right" }
        );
      };

      drawHeader(1);

      let cursorY = 0;

      for (const band of rowBands) {
        const rowH       = band.bottom - band.top;
        const rowHScaled = rowH * ratio;

        if (cursorY > 0 && cursorY * ratio + rowHScaled > usableH) {
          pdf.addPage();
          pageNum++;
          drawHeader(pageNum);
          cursorY = 0;
        }

        // Slice this row out of the full canvas
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
      // Clean up offscreen div if something went wrong
      document.querySelectorAll("div[style*='-99999px']").forEach(n => n.remove());
    } finally {
      setExporting(false);
    }
  }, [tableRef, displayedTickets, serviceName, filterStatus, filterCategory, filterAssignment, filterMonth, filterYear, filterSearch, MONTHS_LOC, t, tStatus, tCategory]);

  // ── Loading ────────────────────────────────────────────────────────────

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