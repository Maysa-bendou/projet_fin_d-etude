import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPaperclip, FaExclamationCircle } from "react-icons/fa";
import { MdAdd, MdClose } from "react-icons/md";

const TYPE_OPTIONS = [
  { value: "incident", label: "Incident" },
  { value: "service_request", label: "Demande de service" },
  { value: "change", label: "Changement" },
  { value: "problem", label: "Problème" },
];
const CATEGORY_OPTIONS = [
  { value: "hardware", label: "Matériel" },
  { value: "software", label: "Logiciels" },
  { value: "network", label: "Réseau" },
  { value: "access", label: "Accès" },
  { value: "security", label: "Sécurité" },
  { value: "account", label: "Compte" },
];
const IMPACT_OPTIONS = [
  { value: "low", label: "Une personne", desc: "Seul mon poste est affecté" },
  { value: "medium", label: "Un service", desc: "Plusieurs collègues bloqués" },
  { value: "high", label: "Entreprise", desc: "L'entreprise entière est impactée" },
];
const URGENCY_OPTIONS = [
  { value: "low", label: "Peut travailler", desc: "Je peux continuer" },
  { value: "medium", label: "Partiellement bloqué", desc: "Certaines tâches impossibles" },
  { value: "high", label: "Complètement bloqué", desc: "Impossible de travailler" },
];

const PRIORITY_MATRIX = {
  high: { high: "critical", medium: "high", low: "medium" },
  medium: { high: "high", medium: "medium", low: "low" },
  low: { high: "medium", medium: "low", low: "low" },
};

const PRIORITY_CONFIG = {
  critical: { label: "Critique", bg: "#fef2f2", color: "#dc2626", border: "#fecaca", dot: "#dc2626", sla: "4 heures", bar: 4 },
  high:     { label: "Haute",    bg: "#fff7ed", color: "#ea580c", border: "#fed7aa", dot: "#ea580c", sla: "24 heures", bar: 3 },
  medium:   { label: "Normale",  bg: "#fefce8", color: "#ca8a04", border: "#fde68a", dot: "#ca8a04", sla: "48 heures", bar: 2 },
  low:      { label: "Basse",    bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", dot: "#16a34a", sla: "72 heures", bar: 1 },
};

// ── SELECT STYLED ──────────────────────────────
const selectStyle = {
  width: "100%",
  border: "1.5px solid #d9d4cc",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 500,
  color: "#1e293b",
  background: "#fff",
  outline: "none",
  appearance: "none",
  cursor: "pointer",
};

// ── LABEL ──────────────────────────────
const Label = ({ children, required }) => (
  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 7, letterSpacing: "0.3px", textTransform: "uppercase" }}>
    {children}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
  </label>
);

// ── SECTION TITLE ──────────────────────────────
const SectionTitle = ({ icon, children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, paddingBottom: 14, borderBottom: "1.5px solid #e8e2d9" }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {icon}
    </div>
    <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{children}</span>
  </div>
);

// ── FILE SELECTOR ──────────────────────────────
const FileSelector = ({ files, setFiles }) => (
  <div>
    <Label>Pièces jointes</Label>
    <div style={{ border: "1.5px dashed #e2e8f0", borderRadius: 10, padding: "14px 16px", background: "#fff", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", minHeight: 52 }}>
      {files.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: "#475569", background: "#fff", border: "1px solid #d9d4cc", borderRadius: 20, padding: "4px 10px 4px 8px" }}>
          <FaPaperclip style={{ color: "#94a3b8", fontSize: 10 }} />
          <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
          <button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
            <MdClose size={13} style={{ color: "#94a3b8" }} />
          </button>
        </div>
      ))}
      <label style={{ display: "flex", alignItems: "center", gap: 5, border: "1.5px solid #3b82f6", borderRadius: 20, padding: "4px 14px", cursor: "pointer", color: "#3b82f6", fontSize: 12, fontWeight: 600, background: "#eff6ff" }}>
        <MdAdd size={14} />
        Ajouter
        <input type="file" multiple style={{ display: "none" }} onChange={e => setFiles(Array.from(e.target.files))} />
      </label>
    </div>
  </div>
);

// ── PRIORITY SUMMARY ──────────────────────────────
const PrioritySummary = ({ priority }) => {
  if (!priority) return (
    <div style={{ background: "#ffffff", border: "1.5px solid #d9d4cc", borderRadius: 12, padding: "16px 18px" }}>
      <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", fontStyle: "italic" }}>
        Sélectionnez l'impact et l'urgence pour voir la priorité calculée
      </p>
    </div>
  );
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <div style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px" }}>Priorité calculée</span>
        <span style={{ background: "#fff", border: `1.5px solid ${cfg.border}`, color: cfg.color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
          {cfg.label}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: `1px solid ${cfg.border}` }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px" }}>Délai SLA</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.sla}</span>
      </div>
      <div style={{ display: "flex", gap: 5, marginTop: 12 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= cfg.bar ? cfg.color : "#ddd9d3" }} />
        ))}
      </div>
    </div>
  );
};

// ── MAIN COMPONENT ──────────────────────────────
export default function CreateTicketPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState({ type: "incident", title: "", description: "", category: "", impact: "", urgency: "" });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const priority = form.impact && form.urgency ? PRIORITY_MATRIX[form.impact][form.urgency] : null;
  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Le titre est obligatoire.");
    if (!form.description.trim()) return setError("La description est obligatoire.");
    if (!form.category) return setError("Veuillez choisir une catégorie.");
    if (!form.impact) return setError("Veuillez choisir un impact.");
    if (!form.urgency) return setError("Veuillez choisir une urgence.");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/tickets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, created_by: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      setSuccess(data.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS ──────────────────────────────
  if (success) {
    const cfg = PRIORITY_CONFIG[success.priority];
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f5f0e8" }}>
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #d9d4cc", padding: "40px 36px", maxWidth: 440, width: "100%", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22, color: "#16a34a", border: "2px solid #bbf7d0" }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Ticket créé avec succès</h2>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 28 }}>
            Ticket <span style={{ fontFamily: "monospace", background: "#fff", padding: "2px 8px", borderRadius: 6, color: "#475569" }}>#{success.id}</span> soumis.
          </p>
          <div style={{ background: "#ffffff", border: "1px solid #d9d4cc", borderRadius: 12, padding: "16px 20px", textAlign: "left", marginBottom: 24 }}>
            {[
              { label: "Priorité", value: <span style={{ background: cfg?.bg, color: cfg?.color, border: `1px solid ${cfg?.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{cfg?.label}</span> },
              { label: "Délai SLA", value: <span style={{ fontWeight: 700, color: "#1e293b" }}>{PRIORITY_CONFIG[success.priority]?.sla}</span> },
              { label: "Date limite", value: <span style={{ fontWeight: 700, color: "#1e293b" }}>{success.sla_date_limite ? new Date(success.sla_date_limite).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</span> },
            ].map((row, i, arr) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>{row.label}</span>
                {row.value}
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/employee/mes-tickets")}
            style={{ width: "100%", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Voir mes tickets
          </button>
        </div>
      </div>
    );
  }

  // ── FORM ──────────────────────────────
  const inputStyle = {
    width: "100%",
    border: "1.5px solid #d9d4cc",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 500,
    color: "#1e293b",
    background: " #ffffff",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ padding: 32, background: "#f9f6f2", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>Créer un ticket support</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Décrivez votre problème précisément pour être assigné à un expert.</p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit}>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #d9d4cc", padding: "32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>

            {/* ── GAUCHE ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <SectionTitle icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              }>Détails de la demande</SectionTitle>

              {/* Type + Catégorie */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <Label required>Type de demande</Label>
                  <div style={{ position: "relative" }}>
                    <select name="type" value={form.type} onChange={handleChange} style={selectStyle}>
                      {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <div>
                  <Label required>Catégorie</Label>
                  <div style={{ position: "relative" }}>
                    <select name="category" value={form.category} onChange={handleChange} style={selectStyle}>
                      <option value="" disabled>Sélectionner...</option>
                      {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>

              {/* Titre */}
              <div>
                <Label required>Titre de la demande</Label>
                <input name="title" value={form.title} onChange={handleChange}
                  placeholder="Ex : VPN impossible à se connecter"
                  style={inputStyle} />
              </div>

              {/* Description */}
              <div style={{ flex: 1 }}>
                <Label required>Description détaillée</Label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={8}
                  placeholder="Donnez des détails sur le contexte, les étapes pour reproduire le problème..."
                  style={{ ...inputStyle, resize: "none", height: 190 }} />
              </div>
            </div>

            {/* ── DROITE ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <SectionTitle icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              }>Priorité & Fichiers</SectionTitle>

              {/* Impact + Urgence */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <Label required>Impact</Label>
                  <div style={{ position: "relative" }}>
                    <select name="impact" value={form.impact} onChange={handleChange} style={selectStyle}>
                      <option value="" disabled>Sélectionner...</option>
                      {IMPACT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <div>
                  <Label required>Urgence</Label>
                  <div style={{ position: "relative" }}>
                    <select name="urgency" value={form.urgency} onChange={handleChange} style={selectStyle}>
                      <option value="" disabled>Sélectionner...</option>
                      {URGENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>

              {/* Priority summary */}
              <PrioritySummary priority={priority} />

              {/* File upload */}
              <FileSelector files={files} setFiles={setFiles} />
            </div>

            {/* Error */}
            {error && (
              <div style={{ gridColumn: "1 / -1", background: "#bfacac", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
                <FaExclamationCircle /> {error}
              </div>
            )}

            {/* Footer buttons */}
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: "1.5px solid #e8e2d9", marginTop: 4 }}>
              <button type="button" onClick={() => navigate(-1)}
                style={{ padding: "10px 24px", border: "1.5px solid #d9d4cc", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#64748b", background: "#fff", cursor: "pointer" }}>
                Annuler
              </button>
              <button type="submit" disabled={loading}
                style={{ padding: "10px 32px", background: loading ? "#94a3b8" : "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                {loading ? "Envoi en cours..." : "Créer le ticket"}
                {!loading && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
