import React, { useState, useEffect } from "react";
import { 
  MdEmail, MdPhone, MdLocationOn, MdBuild, 
  MdLanguage, MdFlag, MdCake, MdMoreVert 
} from "react-icons/md";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Non authentifié");
        const response = await fetch("http://localhost:3001/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Erreur chargement");
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError("Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b", background: "#f9f6f2", minHeight: "100vh" }}>
        Chargement du profil...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#ef4444", background: "#f9f6f2", minHeight: "100vh" }}>
        {error}
      </div>
    );
  }

  const initials = `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase();

  // Style commun pour les cartes
  const cardStyle = {
    background: '#fff',
    borderRadius: 16,
    border: '1.5px solid #d9d4cc',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column'
  };

  const labelStyle = {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: 4
  };

  return (
    <div style={{ padding: "32px 40px", background: "#f9f6f2", minHeight: "100vh", fontFamily: 'sans-serif' }}>
      
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Mon Profil</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Informations personnelles et professionnelles</p>
      </div>

      <div style={{ maxWidth: '1100px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        
        {/* ── CARD 1: IDENTITÉ ── */}
        <div style={{ ...cardStyle, flexDirection: 'row', alignItems: 'center', gap: 24, gridColumn: 'span 1' }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: 12, background: '#fef2f2', border: '1px solid #fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontSize: 28, fontWeight: 800
          }}>
            {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectCover: 'cover', borderRadius: 12 }} alt="avatar" /> : initials}
          </div>
          <div>
            <p style={labelStyle}>Collaborateur</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{user.name} {user.surname}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
              <MdPhone size={16} />
              <span>{user.phone ?? "Non renseigné"}</span>
            </div>
          </div>
        </div>

        {/* ── CARD 2: LOCALISATION ── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Localisation</h3>
            <span style={{ background: '#f5f3ff', color: '#7c3aed', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>BUREAU</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <MdLocationOn size={22} style={{ color: '#6366f1', marginTop: 2 }} />
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>Djezzy Headquarters</span><br />
              Bloc {user.block_number ?? "—"} / Bureau {user.office ?? "—"}
            </div>
          </div>
        </div>

        {/* ── CARD 3: CONTACT ── */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Contact</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <MdEmail size={20} style={{ color: '#3b82f6' }} />
              <div>
                <p style={labelStyle}>Email</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>{user.email}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <MdCake size={20} style={{ color: '#f43f5e' }} />
              <div>
                <p style={labelStyle}>Anniversaire</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>{user.birthday ?? "15 Juillet"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 4: PARAMÈTRES ── */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Paramètres</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <MdLanguage size={20} style={{ color: '#0ea5e9' }} />
              <div>
                <p style={labelStyle}>Langue</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>Français (DZ)</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <MdFlag size={20} style={{ color: '#f59e0b' }} />
              <div>
                <p style={labelStyle}>Nationalité</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>Algérienne</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 5: DÉTAILS PRO ── */}
        <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, background: '#f8fafc', padding: '12px 20px', borderRadius: 10, width: 'fit-content', border: '1px solid #e2e8f0' }}>
            <MdBuild size={18} style={{ color: '#7c3aed' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed', margin: 0 }}>Détails Professionnels</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            <div>
              <p style={labelStyle}>Rôle</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{user.role}</p>
            </div>
            <div>
              <p style={labelStyle}>Département</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{user.department ?? "—"}</p>
            </div>
            {(user.role === "technician" || user.role === "manager") && (
              <div>
                <p style={labelStyle}>Service</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{user.services?.name ?? "Non assigné"}</p>
              </div>
            )}
            <div>
              <p style={labelStyle}>Poste actuel</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{user.job_title ?? "—"}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}