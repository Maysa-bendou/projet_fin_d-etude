// src/config/styles.js
// ── Source unique de vérité pour tous les styles de l'app ──────────────────

export const PRIORITY_CONFIG = {
  low:      { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  medium:   { color: "#ca8a04", bg: "#fefce8", border: "#fde68a" },
  high:     { color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  critical: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" }, // ← was missing
};

export const STATUS_CONFIG = {
  open:             { color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" },
  in_progress:      { color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe" },
  pending:          { color: "#a16207", bg: "#fef9c3", border: "#fef08a" },
  pending_supplier: { color: "#c2410c", bg: "#ffedd5", border: "#fed7aa" },
  resolved:         { color: "#15803d", bg: "#dcfce7", border: "#bbf7d0" },
  closed:           { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
  rejected:         { color: "#dc2626", bg: "#fee2e2", border: "#fecaca" },
};

export const CATEGORY_CONFIG = {
  hardware:   { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  software:   { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  network:    { color: "#0f766e", bg: "#f0fdfa", border: "#99f6e4" },
  security:   { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  access:     { color: "#4338ca", bg: "#eef2ff", border: "#c7d2fe" },
  messagerie: { color: "#db2777", bg: "#fdf2f8", border: "#fbcfe8" },
};

export const IMPACT_CONFIG = {
  low:    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  medium: { color: "#ca8a04", bg: "#fefce8", border: "#fde68a" },
  high:   { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

export const URGENCY_CONFIG = {
  low:    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  medium: { color: "#ca8a04", bg: "#fefce8", border: "#fde68a" },
  high:   { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

// ── Helper générique pour afficher un badge ────────────────────────────────
// usage : <Pill config={PRIORITY_CONFIG} value={ticket.priority} />