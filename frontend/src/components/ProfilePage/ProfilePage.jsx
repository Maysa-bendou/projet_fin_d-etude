import React, { useState, useEffect } from "react";
import { MdEmail, MdPhone, MdLocationOn, MdBadge, MdDomain, MdWork, MdMeetingRoom, MdApartment } from "react-icons/md";
import { HiOutlineIdentification } from "react-icons/hi2";

const ROLE_LABELS = {
  employee: "Employé", technician: "Technicien", chef_service: "Chef de service",
  manager: "Manager", admin: "Administrateur",
};

const InfoRow = ({ icon: Icon, label, value, iconColor = "#94a3b8" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f1ede8" }}>
    <div style={{ width: 34, height: 34, borderRadius: 9, background: "#faf9f7", border: "1px solid #e8e2d9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={16} color={iconColor} />
    </div>
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#b0a99e", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{value || "—"}</p>
    </div>
  </div>
);

const Card = ({ title, icon: Icon, children, span }) => (
  <div style={{ background: "#fff", border: "1px solid #d9d4cc", borderRadius: 14, padding: "22px 24px", gridColumn: span }}>
    {title && (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Icon size={15} color="#b20000" />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>{title}</span>
      </div>
    )}
    {children}
  </div>
);

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Non authentifié");
        const res = await fetch("http://localhost:3001/api/profile", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Erreur chargement");
        setUser(await res.json());
      } catch { setError("Impossible de charger le profil."); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f9f6f2", color: "#94a3b8", fontSize: 14 }}>Chargement…</div>;
  if (error)   return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f9f6f2", color: "#dc2626", fontSize: 14 }}>{error}</div>;

  const initials = `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: "#faf9f7", padding: "32px" }}>

      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 px" }}>Mon Profil</h1>
        <p style={{ fontSize: 14, color: "#4d545e", margin: 0,fontWeight: 530 }}>Informations personnelles et professionnelles</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, maxWidth: 960 }}>

        {/* ── Identity hero card (full width) ── */}
        <div style={{ gridColumn: "1 / -1", background: "#fff", border: "1px solid #d9d4cc", borderRadius: 14, padding: "24px 28px", display: "flex", alignItems: "center", gap: 22 }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: "linear-gradient(135deg,#b20000,#7f1111)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-1px" }}>
              {initials}
            </div>
            <div style={{ position: "absolute", bottom: -3, right: -3, width: 16, height: 16, borderRadius: "50%", background: "#22c55e", border: "2.5px solid #fff" }} />
          </div>

          {/* Name + role */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#b20000", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4 }}>Collaborateur Djezzy</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>{user.name} {user.surname}</h2>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#faf9f7", border: "1px solid #e2ddd8", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600, color: "#64748b" }}>
              <HiOutlineIdentification size={13} />
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>

          {/* Active badge */}
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 12px" }}>● Actif</span>
          </div>
        </div>

        {/* ── Contact ── */}
        <Card title="Contact" icon={MdEmail}>
          <div style={{ marginTop: 12 }}>
            <InfoRow icon={MdEmail}  label="Email"    value={user.email}           iconColor="#3b82f6" />
            <InfoRow icon={MdPhone}  label="Téléphone" value={user.phone}          iconColor="#22c55e" />
          </div>
        </Card>

        {/* ── Localisation ── */}
        <Card title="Localisation" icon={MdLocationOn}>
          <div style={{ marginTop: 12 }}>
            <InfoRow icon={MdApartment}  label="Bloc"   value={user.block_number ? `Bloc ${user.block_number}` : null} iconColor="#8b5cf6" />
            <InfoRow icon={MdMeetingRoom} label="Bureau" value={user.office ? ` ${user.office}` : null}          iconColor="#f59e0b" />
          </div>
        </Card>

        {/* ── Poste ── */}
        <Card title="Poste" icon={MdWork}>
          <div style={{ marginTop: 12 }}>
            <InfoRow icon={MdWork}   label="Intitulé"    value={user.job_title}                                           iconColor="#b20000" />
            <InfoRow icon={MdDomain} label="Département" value={user.department}                                          iconColor="#0ea5e9" />
            {(user.role === "technician" || user.role === "manager" || user.role === "chef_service") && (
              <InfoRow icon={MdBadge} label="Service" value={user.services?.name} iconColor="#7c3aed" />
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}