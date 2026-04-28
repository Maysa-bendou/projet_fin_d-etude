import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MdPeople, MdAssignment, MdTimer, MdShield, MdComputer,
  MdWifi, MdLock, MdEmail, MdBuild, MdPerson, MdGroup,
  MdBusiness, MdSupervisorAccount, MdAdminPanelSettings,
  MdEngineering, MdCheckCircle, MdWarning, MdError,
  MdInfo, MdBlock, MdPause, MdDone,
} from "react-icons/md";
import {
  HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown,
  HiOutlineMinus,
} from "react-icons/hi2";
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  CATEGORY_CONFIG,
  IMPACT_CONFIG,
  URGENCY_CONFIG,
} from "../../../config/styles";

// ── Config ─────────────────────────────────────────────────────────────────

// critical only exists in sla_config, NOT in priority_enum — kept here only for SLA table
const SLA_PRIORITY_CONFIG = {
  critical: { color: "#A32D2D", bg: "#FCEBEB", border: "#fecaca" },
  high:     PRIORITY_CONFIG.high,
  medium:   PRIORITY_CONFIG.medium,
  low:      PRIORITY_CONFIG.low,
};

const ROLE_CONFIG = {
  employee:     { color: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
  technician:   { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  chef_service: { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  manager:      { color: "#0f766e", bg: "#f0fdfa", border: "#99f6e4" },
  admin:        { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
};

const CATEGORY_ICONS = {
  hardware:   <MdBuild   size={13} />,
  software:   <MdComputer size={13} />,
  network:    <MdWifi    size={13} />,
  access:     <MdLock    size={13} />,
  security:   <MdShield  size={13} />,
  messagerie: <MdEmail   size={13} />,
};

const ROLE_ICONS = {
  employee:     <MdPerson             size={13} />,
  technician:   <MdEngineering        size={13} />,
  chef_service: <MdSupervisorAccount  size={13} />,
  manager:      <MdBusiness           size={13} />,
  admin:        <MdAdminPanelSettings size={13} />,
};

const STATUS_ICONS = {
  open:             <MdInfo        size={13} />,
  in_progress:      <MdEngineering size={13} />,
  pending:          <MdPause       size={13} />,
  pending_supplier: <MdPause       size={13} />,
  resolved:         <MdDone        size={13} />,
  closed:           <MdCheckCircle size={13} />,
  rejected:         <MdBlock       size={13} />,
};

const PRIORITY_ICONS = {
  critical: <MdError   size={13} />,
  high:     <MdWarning size={13} />,
  medium:   <HiOutlineMinus size={13} />,
  low:      <MdInfo    size={13} />,
};

const IMPACT_ICONS = {
  high:   <MdBusiness size={13} />,
  medium: <MdGroup    size={13} />,
  low:    <MdPerson   size={13} />,
};

const URGENCY_ICONS = {
  high:   <MdError           size={13} />,
  medium: <HiOutlineArrowTrendingUp size={13} />,
  low:    <HiOutlineArrowTrendingDown size={13} />,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDeadline(hours, t) {
  if (!hours || hours < 1) return "—";
  if (hours < 24) return t("adminParams.sla.hours", { count: hours });
  const days = hours / 24;
  if (Number.isInteger(days)) return t("adminParams.sla.days", { count: days });
  return t("adminParams.sla.daysDecimal", { count: days.toFixed(1) });
}

// ── Badge components ───────────────────────────────────────────────────────

const Badge = ({ cfg, value, label, icon }) => {
  const c = cfg[value];
  if (!c) return <span style={{ fontSize: 12, color: "#94a3b8" }}>{label || value}</span>;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 11px", borderRadius: 99, fontSize: 12, fontWeight: 600,
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
    }}>
      {icon && <span style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>{icon}</span>}
      {label || c.label || value}
    </span>
  );
};

const BadgeWithDesc = ({ cfg, value, label, desc, icon }) => {
  const c = cfg[value];
  if (!c) return <span style={{ fontSize: 12, color: "#94a3b8" }}>{label || value}</span>;
  return (
    <div style={{
      display: "inline-flex", flexDirection: "column", gap: 3,
      padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
      minWidth: 130,
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 700 }}>
        {icon && <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>}
        <span style={{ textTransform: "capitalize" }}>{label || value}</span>
      </span>
      <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.8, paddingLeft: icon ? 18 : 0 }}>{desc || c.label}</span>
    </div>
  );
};

// ── Section ────────────────────────────────────────────────────────────────

const SectionGroup = ({ title, children }) => (
  <div>
    <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
      {title}
    </p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
  </div>
);

// ── Divider ────────────────────────────────────────────────────────────────

const Divider = () => <div style={{ height: 1, background: "#f1f5f9" }} />;

// ── Main ───────────────────────────────────────────────────────────────────

export default function ParametresAdmin() {
  const { t } = useTranslation("admin");

  const [stats,    setStats]    = useState({});
  const [sla,      setSla]      = useState([]);
  const [config,   setConfig]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savedId,  setSavedId]  = useState(null);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
        const [statsRes, configRes, slaRes] = await Promise.all([
          fetch("http://localhost:3001/api/admin/stats",  { headers: h }).then(r => r.json()),
          fetch("http://localhost:3001/api/admin/config", { headers: h }).then(r => r.json()),
          fetch("http://localhost:3001/api/sla",          { headers: h }).then(r => r.json()),
        ]);
        setStats(statsRes);
        setConfig(configRes);
        setSla(slaRes);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const updateSla = async (id, value) => {
    const parsed = parseInt(value);
    if (!parsed || parsed < 1) return;
    setSla(prev => prev.map(s => s.id === id ? { ...s, duration_hours: parsed } : s));
    setSavingId(id);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await fetch(`http://localhost:3001/api/sla/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ duration_hours: parsed }),
      });
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
    } catch { setError(t("adminParams.sla.updateError")); }
    finally { setSavingId(null); }
  };

  // SLA can have critical even if priority_enum doesn't — so we keep the full order here
  const SLA_ORDER = ["high", "medium", "low"];
  const slaOrdered = SLA_ORDER.map(p => sla.find(s => s.priority === p)).filter(Boolean);

  // DB enums — priority_enum has NO critical
  const DB = {
    priorities: config?.enums?.priorities || ["low", "medium", "high"],
    statuses:   config?.enums?.statuses   || ["open", "in_progress", "pending", "pending_supplier", "resolved", "closed", "rejected"],
    impacts:    config?.enums?.impacts    || ["low", "medium", "high"],
    urgencies:  config?.enums?.urgencies  || ["low", "medium", "high"],
    categories: config?.enums?.categories || ["hardware", "software", "network", "access", "security", "messagerie"],
    roles:      config?.enums?.roles      || ["employee", "technician", "chef_service", "manager", "admin"],
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#faf9f7" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#b91c1c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f7] p-8 font-sans">
      <div>

        {/* HEADER */}
        <div style={{ marginBottom: 28 }}>
          <h1 className="text-2xl font-bold text-slate-900">{t("adminParams.title")}</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0, fontWeight: 500 }}>{t("adminParams.subtitle")}</p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", color: "#dc2626", fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* KPI CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[
            { icon: <MdPeople size={24} color="#2563eb" />,     bg: "#eff6ff", label: t("adminAccueil.stats.users"),   value: stats.totalUsers   },
            { icon: <MdAssignment size={24} color="#b91c1c" />, bg: "#fef2f2", label: t("adminAccueil.stats.tickets"), value: stats.totalTickets },
          ].map(({ icon, bg, label, value }) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: 0 }}>{value ?? "—"}</p>
              </div>
            </div>
          ))}
        </div>

        {/* SLA */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 24 }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
  <MdTimer size={17} color="#b91c1c" />
</div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>{t("adminParams.sla.title")}</h2>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#faf9f7", borderBottom: "1px solid #e5e7eb" }}>
                    {[
                      t("adminParams.sla.colPriority"),
                      t("adminParams.sla.colDuration"),
                      t("adminParams.sla.colDeadline"),
                      t("adminParams.sla.colStatus"),
                    ].map((col, i) => (
                      <th key={i} style={{ padding: "10px 20px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slaOrdered.map((s, idx) => (
                    <tr key={s.id} style={{ borderBottom: idx < slaOrdered.length - 1 ? "1px solid #f8f8f8" : "none" }}>
                      <td style={{ padding: "12px 20px" }}>
                        <Badge
                          cfg={SLA_PRIORITY_CONFIG}
                          value={s.priority}
                          label={t(`adminParams.enums.priorities.${s.priority}`)}
                          icon={PRIORITY_ICONS[s.priority]}
                        />
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <input
                          type="number" value={s.duration_hours}
                          onChange={e => updateSla(s.id, e.target.value)}
                          style={{ width: 72, padding: "6px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#0f172a", outline: "none" }}
                        />
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                        {formatDeadline(s.duration_hours, t)}
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700 }}>
                        {savingId === s.id
                          ? <span style={{ color: "#2563eb", display: "flex", alignItems: "center", gap: 4 }}><MdTimer size={13} />{t("adminParams.sla.saving")}</span>
                          : savedId === s.id
                          ? <span style={{ color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}><MdCheckCircle size={13} /> {t("adminParams.sla.saved")}</span>
                          : <span style={{ color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 10px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 4 }}><MdCheckCircle size={12} />{t("adminParams.sla.active")}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 14, padding: "11px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <MdInfo size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <span style={{ fontSize: 12, color: "#1e40af", fontWeight: 600 }}>{t("adminParams.sla.autoCalcLabel")}: </span>
                <span style={{ fontSize: 12, color: "#3b82f6" }}>{t("adminParams.sla.autoCalcText")}</span>
                <div style={{ marginTop: 6 }}>
                  <code style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", fontStyle: "italic", background: "#fff", padding: "3px 10px", borderRadius: 6, border: "1px solid #bfdbfe" }}>
                    sla_deadline = creation_date + duration_hours
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SYSTEM VALUES */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>{t("adminParams.systemValues.title")}</h2>
          </div>
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 0 }}>

            <div style={{ paddingBottom: 20 }}>
              <SectionGroup title={t("adminParams.systemValues.priorities")}>
                {DB.priorities.map(v => (
                  <Badge key={v} cfg={PRIORITY_CONFIG} value={v}
                    label={t(`adminParams.enums.priorities.${v}`)}
                    icon={PRIORITY_ICONS[v]}
                  />
                ))}
              </SectionGroup>
            </div>

            <Divider />

            <div style={{ paddingTop: 20, paddingBottom: 20 }}>
              <SectionGroup title={t("adminParams.systemValues.statuses")}>
                {DB.statuses.map(v => (
                  <Badge key={v} cfg={STATUS_CONFIG} value={v}
                    label={t(`adminParams.enums.statuses.${v}`)}
                    icon={STATUS_ICONS[v]}
                  />
                ))}
              </SectionGroup>
            </div>

            <Divider />

            <div style={{ paddingTop: 20, paddingBottom: 20 }}>
              <SectionGroup title={t("adminParams.systemValues.categories")}>
                {DB.categories.map(v => (
                  <Badge key={v} cfg={CATEGORY_CONFIG} value={v}
                    label={t(`adminParams.enums.categories.${v}`)}
                    icon={CATEGORY_ICONS[v]}
                  />
                ))}
              </SectionGroup>
            </div>

            <Divider />

            <div style={{ paddingTop: 20, paddingBottom: 20 }}>
              <SectionGroup title={t("adminParams.systemValues.impacts")}>
                {DB.impacts.map(v => (
                  <BadgeWithDesc key={v} cfg={IMPACT_CONFIG} value={v}
                    label={t(`adminParams.enums.impacts.${v}`)}
                    desc={t(`adminParams.enums.impactDesc.${v}`)}
                    icon={IMPACT_ICONS[v]}
                  />
                ))}
              </SectionGroup>
            </div>

            <Divider />

            <div style={{ paddingTop: 20, paddingBottom: 20 }}>
              <SectionGroup title={t("adminParams.systemValues.urgencies")}>
                {DB.urgencies.map(v => (
                  <BadgeWithDesc key={v} cfg={URGENCY_CONFIG} value={v}
                    label={t(`adminParams.enums.urgencies.${v}`)}
                    desc={t(`adminParams.enums.urgencyDesc.${v}`)}
                    icon={URGENCY_ICONS[v]}
                  />
                ))}
              </SectionGroup>
            </div>

            <Divider />

            <div style={{ paddingTop: 20 }}>
              <SectionGroup title={t("adminParams.systemValues.roles")}>
                {DB.roles.map(v => (
                  <Badge key={v} cfg={ROLE_CONFIG} value={v}
                    label={t(`adminParams.enums.roles.${v}`)}
                    icon={ROLE_ICONS[v]}
                  />
                ))}
              </SectionGroup>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}