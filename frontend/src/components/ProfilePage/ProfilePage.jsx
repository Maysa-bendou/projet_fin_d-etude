import React, { useState, useEffect } from "react";
import { MdEmail, MdPhone, MdLocationOn, MdBadge, MdDomain, MdWork, MdMeetingRoom, MdApartment } from "react-icons/md";
import { HiOutlineIdentification } from "react-icons/hi2";
import { useTranslation } from "react-i18next";

const InfoRow = ({ icon: Icon, label, value, iconColor = "#94a3b8" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 0", borderBottom: "1px solid #f1ede8" }}>
    <div style={{ width: 52, height: 52, borderRadius: 14, background: "#faf9f7", border: "1px solid #e8e2d9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={26} color={iconColor} />
    </div>
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#b0a99e", textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: 0 }}>{value || "—"}</p>
    </div>
  </div>
);

const Card = ({ title, icon: Icon, children, span }) => (
  <div style={{ background: "#fff", border: "1px solid #d9d4cc", borderRadius: 14, padding: "28px 30px", gridColumn: span }}>
    {title && (
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, paddingBottom: 18, borderBottom: "1px solid #f1ede8" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fdf2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} color="#b20000" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>{title}</span>
      </div>
    )}
    {children}
  </div>
);

export default function ProfilePage() {
  const { t } = useTranslation("profil");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error(t("errors.notAuthenticated"));
        const res = await fetch("http://localhost:3001/api/profile", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(t("errors.loadError"));
        setUser(await res.json());
      } catch { setError(t("errors.cannotLoad")); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f9f6f2", color: "#94a3b8", fontSize: 14 }}>{t("loading")}</div>;
  if (error)   return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f9f6f2", color: "#dc2626", fontSize: 14 }}>{error}</div>;

  const initials = `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: "#faf9f7", padding: "22px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, width: "100%" }}>

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>Mon Profil</h1>
          <p style={{ fontSize: 14, color: "#44484d", margin: 0, fontWeight: 530 }}>Informations personnelles et professionnelles</p>
        </div>

        {/* ── Identity hero card (full width) ── */}
        <div style={{ gridColumn: "1 / -1", background: "#fff", border: "1px solid #d9d4cc", borderRadius: 14, padding: "24px 28px", display: "flex", alignItems: "center", gap: 22 }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-1px" }}>
              {initials}
            </div>
            <div style={{ position: "absolute", bottom: -3, right: -3, width: 16, height: 16, borderRadius: "50%", background: "#22c55e", border: "2.5px solid #fff" }} />
          </div>

          {/* Name + role */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#b20000", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4 }}>{t("collaboratorLabel")}</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>{user.name} {user.surname}</h2>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#faf9f7", border: "1px solid #e2ddd8", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600, color: "#64748b" }}>
              <HiOutlineIdentification size={13} />
              {t(`roles.${user.role}`, { defaultValue: user.role })}
            </span>
          </div>

          {/* Active badge */}
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 12px" }}>● {t("active")}</span>
          </div>
        </div>

        {/* ── Contact ── */}
        <Card title={t("cards.contact")} icon={MdEmail}>
          <div style={{ marginTop: 12 }}>
            <InfoRow icon={MdEmail} label={t("fields.email")} value={user.email} iconColor="#3b82f6" />
            <InfoRow icon={MdPhone} label={t("fields.phone")} value={user.phone} iconColor="#22c55e" />
          </div>
        </Card>

        {/* ── Localisation ── */}
        <Card title={t("cards.location")} icon={MdLocationOn}>
          <div style={{ marginTop: 12 }}>
            <InfoRow icon={MdApartment}   label={t("fields.block")}  value={user.block_number ? `${t("fields.blockPrefix")} ${user.block_number}` : null} iconColor="#8b5cf6" />
            <InfoRow icon={MdMeetingRoom} label={t("fields.office")} value={user.office ? ` ${user.office}` : null} iconColor="#f59e0b" />
          </div>
        </Card>

        {/* ── Poste ── */}
        <Card title={t("cards.position")} icon={MdWork}>
          <div style={{ marginTop: 12 }}>
            <InfoRow icon={MdWork}   label={t("fields.jobTitle")}   value={user.job_title}  iconColor="#8d1212" />
            <InfoRow icon={MdDomain} label={t("fields.department")} value={user.department} iconColor="#0ea5e9" />
            {(user.role === "technician" || user.role === "manager" || user.role === "chef_service") && (
              <InfoRow icon={MdBadge} label={t("fields.service")} value={user.services?.name} iconColor="#7c3aed" />
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
