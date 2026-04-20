import { useEffect, useState } from "react";
import { MdSettings, MdPeople, MdAssignment, MdTimer, MdCheckCircle } from "react-icons/md";

const PRIORITY_LABELS = {
  critical: { label: "Critique", color: "#A32D2D", bg: "#FCEBEB" },
  high:     { label: "Haute",    color: "#854F0B", bg: "#FAEEDA" },
  medium:   { label: "Moyenne",  color: "#185FA5", bg: "#E6F1FB" },
  low:      { label: "Basse",    color: "#3B6D11", bg: "#EAF3DE" },
};

const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

function formatDelai(heures) {
  if (!heures || heures < 1) return "—";
  if (heures < 24) return `${heures} heure${heures > 1 ? "s" : ""}`;
  const jours = heures / 24;
  if (Number.isInteger(jours)) return `${jours} jour${jours > 1 ? "s" : ""}`;
  return `${jours.toFixed(1)} jours`;
}

const STATUTS_FR = {
  open: "Ouvert", in_progress: "En cours", pending: "En attente",
  pending_supplier: "Attente fournisseur", resolved: "Résolu",
  closed: "Fermé", rejected: "Rejeté",
};
const IMPACTS_FR   = { low: "Faible", medium: "Moyen", high: "Élevé" };
const URGENCES_FR  = { low: "Faible", medium: "Moyenne", high: "Élevée" };
const PRIORITES_FR = { low: "Basse", medium: "Moyenne", high: "Haute", critical: "Critique" };
const ROLES_FR = {
  employee: "Employé", technician: "Technicien", chef_service: "Chef de service",
  manager: "Manager", admin: "Administrateur",
};
const CATEGORIES_FR = {
  hardware: "Matériel", software: "Logiciel", network: "Réseau",
  access: "Accès", security: "Sécurité", account: "Compte",
};

export default function ParametresAdmin() {
  const [stats, setStats]     = useState({});
  const [sla, setSla]         = useState([]);
  const [config, setConfig]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId]   = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

        const [statsRes, configRes, slaRes] = await Promise.all([
          fetch("http://localhost:3001/api/admin/stats", { headers }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
          fetch("http://localhost:3001/api/admin/config", { headers }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
          fetch("http://localhost:3001/api/sla", { headers }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
        ]);

        setStats(statsRes);
        setConfig(configRes);
        setSla(slaRes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const updateSla = async (id, value) => {
    const parsed = parseInt(value);
    if (!parsed || parsed < 1) return;
    setSla(prev => prev.map(s => s.id === id ? { ...s, duration_hours: parsed } : s));
    setSavingId(id);
    setSavedId(null);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/api/sla/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ duration_hours: parsed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      setError("Échec de la mise à jour du SLA.");
    } finally {
      setSavingId(null);
    }
  };

  const slaOrdered = PRIORITY_ORDER.map(p => sla.find(s => s.priority === p)).filter(Boolean);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', padding: '40px 32px', maxWidth: 900, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <MdSettings style={{ color: '#3b82f6', fontSize: 26 }} />
          Paramètres administrateur
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Configuration du système et des règles SLA</p>
      </div>

      {/* ERREUR */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 20px', marginBottom: 24, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdPeople style={{ fontSize: 24, color: '#3b82f6' }} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px 0' }}>Utilisateurs</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 2px 0', lineHeight: 1 }}>{stats.totalUsers ?? "—"}</p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>comptes enregistrés</p>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdAssignment style={{ fontSize: 24, color: '#16a34a' }} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px 0' }}>Tickets</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 2px 0', lineHeight: 1 }}>{stats.totalTickets ?? "—"}</p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>tickets au total</p>
          </div>
        </div>
      </div>

      {/* SLA CARD */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 20 }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MdTimer style={{ color: '#3b82f6', fontSize: 18 }} />
            Configuration SLA
          </h2>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
            Durée maximale de résolution par priorité. Appliquée automatiquement à la création de chaque ticket.
          </p>
        </div>

        {/* Inner card avec tableau */}
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ background: '#f9f6f2', borderBottom: '1px solid #e8e4de' }}>
                  {['Priorité', 'Durée (heures)', 'Délai indicatif', 'Statut'].map((col, i) => (
                    <th key={i} style={{
                      padding: '11px 20px', fontSize: 11, fontWeight: 700,
                      color: '#6b7280', textTransform: 'uppercase',
                      letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap'
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slaOrdered.map((s, idx) => {
                  const p = PRIORITY_LABELS[s.priority] || { label: s.priority, color: '#555', bg: '#eee' };
                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: idx < slaOrdered.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Badge priorité */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 12, fontWeight: 700,
                          padding: '4px 12px', borderRadius: 99,
                          background: p.bg, color: p.color
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                          {p.label}
                        </span>
                      </td>

                      {/* Input heures */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min="1"
                            value={s.duration_hours}
                            onChange={e => updateSla(s.id, e.target.value)}
                            style={{
                              width: 72, padding: '6px 10px',
                              border: '1px solid #e5e7eb', borderRadius: 8,
                              fontSize: 13, fontWeight: 600, color: '#111827',
                              outline: 'none', fontFamily: 'Inter, sans-serif',
                              background: '#f9fafb'
                            }}
                            onFocus={e => e.target.style.borderColor = '#3b82f6'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                          />
                          <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>h</span>
                        </div>
                      </td>

                      {/* Délai */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
                        {formatDelai(s.duration_hours)}
                      </td>

                      {/* Statut */}
                      <td style={{ padding: '14px 20px' }}>
                        {savingId === s.id && (
                          <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>Enregistrement...</span>
                        )}
                        {savedId === s.id && (
                          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MdCheckCircle style={{ fontSize: 14 }} /> Enregistré
                          </span>
                        )}
                        {savingId !== s.id && savedId !== s.id && (
                          <span style={{
                            fontSize: 12, fontWeight: 700,
                            color: '#16a34a', background: '#f0fdf4',
                            padding: '3px 10px', borderRadius: 99,
                            border: '1px solid #bbf7d0'
                          }}>
                            Actif
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Note bleue */}
          <div style={{
            marginTop: 12, background: '#eff6ff', border: '1px solid #dbeafe',
            borderRadius: 10, padding: '10px 16px',
            fontSize: 12, color: '#1d4ed8', lineHeight: 1.6
          }}>
            <strong>Calcul automatique :</strong> lors de la création du ticket,{' '}
            <code style={{ background: '#dbeafe', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
              sla_date_limite = sla_date_debut + duration_hours
            </code>{' '}
            selon la priorité choisie.
          </div>
        </div>
      </div>

      {/* VALEURS SYSTÈME CARD */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
            Valeurs du système
          </h2>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {[
              { label: 'Priorités',  items: config?.enums?.priorities || [], map: PRIORITES_FR },
              { label: 'Statuts',    items: config?.enums?.statuses   || [], map: STATUTS_FR   },
              { label: 'Impact',     items: config?.enums?.impacts     || [], map: IMPACTS_FR   },
              { label: 'Urgence',    items: config?.enums?.urgencies   || [], map: URGENCES_FR  },
              { label: 'Catégories', items: config?.enums?.categories  || [], map: CATEGORIES_FR },
              { label: 'Rôles',      items: config?.enums?.roles       || [], map: ROLES_FR     },
            ].map(({ label, items, map }) => (
              <div key={label}>
                <p style={{
                  fontSize: 11, fontWeight: 700, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  margin: '0 0 10px 0'
                }}>
                  {label}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {items.map(item => (
                    <span key={item} style={{
                      fontSize: 12, fontWeight: 500,
                      padding: '4px 12px', borderRadius: 99,
                      background: '#f9fafb', border: '1px solid #e5e7eb',
                      color: '#374151'
                    }}>
                      {map[item] || item}
                    </span>
                  ))}
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>

    </div>
  );
}
