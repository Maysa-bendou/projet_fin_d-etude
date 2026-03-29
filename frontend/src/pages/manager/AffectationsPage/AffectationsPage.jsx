import { useState } from "react";

const techniciens = ["Karim Haddad", "Nadia Ferhat", "Anis Bouzid"];

const initialNonAssignes = [
  { id: "IM000015", titre: "PC ne démarre plus après coupure", priorite: "Haute",   service: "IT Support",  user: "Omar Bensaid", date: "2026-03-17" },
  { id: "IM000014", titre: "Coupures VPN récurrentes",         priorite: "Normale", service: "IT Security", user: "Lina Amrani",  date: "2026-03-16" },
  { id: "IM000013", titre: "Mot de passe expiré",              priorite: "Basse",   service: "Service Desk",user: "Sara Haddad",  date: "2026-03-15" },
];

const ticketsAssignes = [
  { id: "IM000012", titre: "Imprimante hors ligne",  priorite: "Normale", service: "IT Support", technicien: "Karim Haddad", initiales: "KH", couleurAv: "#1e40af", statut: "En cours" },
  { id: "IM000011", titre: "Outlook ne s'ouvre plus",priorite: "Haute",   service: "IT Support", technicien: "Nadia Ferhat",  initiales: "NF", couleurAv: "#6d28d9", statut: "Résolu"   },
];

/* ── Helpers ── */
const prioriteStyle = (p) => {
  if (p === "Haute")   return { bg: "#fff1f3", color: "#e11d48" };
  if (p === "Normale") return { bg: "#fffbeb", color: "#d97706" };
  return                      { bg: "#f0fdf4", color: "#16a34a" };
};

const serviceStyle = (s) => {
  if (s === "IT Support")  return { bg: "#eff6ff", color: "#2563eb" };
  if (s === "IT Security") return { bg: "#f5f3ff", color: "#7c3aed" };
  return                          { bg: "#fff7ed", color: "#ea580c" };
};

const statutStyle = (s) => {
  if (s === "Résolu")   return { bg: "#f0fdf4", color: "#16a34a" };
  return                       { bg: "#fffbeb", color: "#d97706" };
};

const borderLeft = (p) => {
  if (p === "Haute")   return "#e11d48";
  if (p === "Normale") return "#d97706";
  return "#16a34a";
};

function Badge({ label, style }) {
  return (
    <span style={{
      background: style.bg, color: style.color,
      fontSize: 11, fontWeight: 700,
      padding: "2px 9px", borderRadius: 20,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      background: "#1a1d27", color: "#fff",
      fontSize: 13, fontWeight: 600,
      padding: "10px 22px", borderRadius: 100,
      boxShadow: "0 8px 28px rgba(0,0,0,.18)",
      whiteSpace: "nowrap", zIndex: 999,
      animation: "fadeIn .25s ease",
    }}>
      {message}
    </div>
  );
}

export default function TicketsManager() {
  const [nonAssignes, setNonAssignes] = useState(initialNonAssignes);
  const [selections, setSelections]   = useState({});
  const [toast, setToast]             = useState("");
  const [removing, setRemoving]       = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const handleAssigner = (ticket) => {
    const tech = selections[ticket.id];
    if (!tech) { showToast("⚠️ Veuillez choisir un technicien"); return; }
    setRemoving(ticket.id);
    setTimeout(() => {
      setNonAssignes((prev) => prev.filter((t) => t.id !== ticket.id));
      setRemoving(null);
      showToast(`✓ ${ticket.id} assigné à ${tech}`);
    }, 300);
  };

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", background: "#f7f8fa", minHeight: "100vh", padding: "28px 24px", color: "#1a1d27" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .ticket-card { transition: transform .2s, box-shadow .2s, border-color .2s; }
        .ticket-card:hover { transform: translateX(3px); box-shadow: 0 6px 24px rgba(0,0,0,.09) !important; border-color: #c8ccda !important; }
        .btn-assign:hover   { background: #166534 !important; box-shadow: 0 4px 16px rgba(21,128,61,.45) !important; }
        .btn-reassign:hover { background: #9a3412 !important; box-shadow: 0 4px 16px rgba(194,65,12,.45) !important; }
        tr:hover td { background: #f1f3f7; }
        select option { background: #fff; }
        @keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes slideOut { to { opacity:0; transform:translateX(16px); } }
        .removing { animation: slideOut .3s ease forwards; }
      `}</style>

      {/* ── Header ── */}
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, background: "#1a1d27", borderRadius: 12, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-.5px" }}>
            IT
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.3px" }}>Support Center</div>
            <div style={{ fontSize: 12, color: "#9399ad", marginTop: 2 }}>Gestion des incidents · Mars 2026</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {[
            { num: nonAssignes.length, label: "Non assignés", color: "#e11d48" },
            { num: 5,                  label: "Assignés",     color: "#16a34a" },
            { num: 1,                  label: "Résolus",      color: "#2563eb" },
          ].map(({ num, label, color }) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #e4e7ef", borderRadius: 14, padding: "12px 18px", textAlign: "right", minWidth: 90, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500, color, lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 11, color: "#9399ad", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* ── Tickets non assignés ── */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: "#9399ad" }}>
            Tickets non assignés
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600, background: "#fff1f3", color: "#e11d48", padding: "2px 9px", borderRadius: 20 }}>
            {nonAssignes.length}
          </span>
        </div>

        {nonAssignes.map((t) => {
          const ps = prioriteStyle(t.priorite);
          const ss = serviceStyle(t.service);
          return (
            <div
              key={t.id}
              className={`ticket-card${removing === t.id ? " removing" : ""}`}
              style={{
                background: "#fff",
                border: "1px solid #e4e7ef",
                borderRadius: 16,
                padding: "18px 20px",
                marginBottom: 8,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                borderLeft: `3px solid ${borderLeft(t.priorite)}`,
              }}
            >
              {/* Left */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9399ad" }}>{t.id}</span>
                  <Badge label={t.priorite} style={ps} />
                  <Badge label={t.service}  style={ss} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{t.titre}</div>
                <div style={{ fontSize: 12, color: "#9399ad", marginTop: 4 }}>{t.user} · {t.date}</div>
              </div>

              {/* Right */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <select
                  value={selections[t.id] || ""}
                  onChange={(e) => setSelections((prev) => ({ ...prev, [t.id]: e.target.value }))}
                  style={{
                    appearance: "none", background: "#f1f3f7", border: "1px solid #e4e7ef",
                    color: "#1a1d27", fontFamily: "'Syne', sans-serif", fontSize: 12,
                    padding: "8px 12px", borderRadius: 10, cursor: "pointer", outline: "none", minWidth: 160,
                  }}
                >
                  <option value="">Choisir technicien…</option>
                  {techniciens.map((tech) => <option key={tech}>{tech}</option>)}
                </select>

                <button
                  className="btn-assign"
                  onClick={() => handleAssigner(t)}
                  style={{
                    background: "#447053", border: "2px solid #a5b3aa", borderRadius: 10,
                    fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 800,
                    color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,.25)",
                    padding: "8px 18px", cursor: "pointer", whiteSpace: "nowrap", letterSpacing: ".4px",
                    boxShadow: "0 2px 8px rgba(21,128,61,.3)", transition: "background .15s, box-shadow .15s",
                  }}
                >
                  Assigner
                </button>
              </div>
            </div>
          );
        })}

        {nonAssignes.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px", color: "#9399ad", fontSize: 14, background: "#fff", border: "1px dashed #e4e7ef", borderRadius: 16 }}>
            ✓ Tous les tickets ont été assignés
          </div>
        )}
      </section>

      {/* ── Tickets assignés ── */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: "#9399ad" }}>
            Tickets assignés
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600, background: "#f0fdf4", color: "#16a34a", padding: "2px 9px", borderRadius: 20 }}>
            5
          </span>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e4e7ef", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f3f7", borderBottom: "1px solid #e4e7ef" }}>
                {["ID", "Titre", "Priorité", "Service", "Technicien", "Statut", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#9399ad" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ticketsAssignes.map((t, i) => {
                const ps = prioriteStyle(t.priorite);
                const ss = serviceStyle(t.service);
                const sts = statutStyle(t.statut);
                return (
                  <tr key={t.id} style={{ borderBottom: i < ticketsAssignes.length - 1 ? "1px solid #e4e7ef" : "none" }}>
                    <td style={{ padding: "14px 16px", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9399ad" }}>{t.id}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, fontSize: 13 }}>{t.titre}</td>
                    <td style={{ padding: "14px 16px" }}><Badge label={t.priorite} style={ps} /></td>
                    <td style={{ padding: "14px 16px" }}><Badge label={t.service}  style={ss} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: t.couleurAv, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", marginRight: 8, flexShrink: 0 }}>
                          {t.initiales}
                        </div>
                        <span style={{ fontSize: 13 }}>{t.technicien}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}><Badge label={t.statut} style={sts} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        className="btn-reassign"
                        onClick={() => showToast(`Réassignation ${t.id} ouverte`)}
                        style={{
                          background: "#c42f27", border: "2px solid #9a1b19", borderRadius: 8,
                          fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 800,
                          color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,.25)",
                          padding: "6px 14px", cursor: "pointer", whiteSpace: "nowrap", letterSpacing: ".4px",
                          boxShadow: "0 2px 8px rgba(194,65,12,.3)", transition: "background .15s, box-shadow .15s",
                        }}
                      >
                        Réassigner
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Toast message={toast} />
    </div>
  );
}
