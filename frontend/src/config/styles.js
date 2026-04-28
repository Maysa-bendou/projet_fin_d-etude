// src/config/styles.js
// ── Source unique de vérité pour tous les styles de l'app ──────────────────

export const PRIORITY_CONFIG = {
  high:   { label: "Haute",   color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  medium: { label: "Normale", color: "#ca8a04", bg: "#fefce8", border: "#fde68a" },
  low:    { label: "Basse",   color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
};

export const STATUS_CONFIG = {
  open:             { label: "Ouvert",              color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  in_progress:      { label: "En cours",            color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  pending:          { label: "En attente",          color: "#a16207", bg: "#fefce8", border: "#fde68a" },
  pending_supplier: { label: "Att. fournisseur",    color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  resolved:         { label: "Résolu",              color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  closed:           { label: "Fermé",               color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
  rejected:         { label: "Rejeté",              color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

export const CATEGORY_CONFIG = {
  hardware:   { label: "Matériel",                  color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  software:   { label: "Logiciels",                 color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  network:    { label: "Réseau",                    color: "#0f766e", bg: "#f0fdfa", border: "#99f6e4" },
  security:   { label: "Sécurité",                  color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  access:     { label: "Accès",                     color: "#4338ca", bg: "#eef2ff", border: "#c7d2fe" },
  messagerie: { label: "Messagerie", color: "#db2777", bg: "#fdf2f8", border: "#fbcfe8" },
};

export const IMPACT_CONFIG = {
  high:   { label: "Entreprise",        color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  medium: { label: "Un service",        color: "#ca8a04", bg: "#fefce8", border: "#fde68a" },
  low:    { label: "Une personne",      color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
};

export const URGENCY_CONFIG = {
  high:   { label: "Complètement bloqué",    color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  medium: { label: "Partiellement bloqué",   color: "#ca8a04", bg: "#fefce8", border: "#fde68a" },
  low:    { label: "Peut travailler",         color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
};

// ── Helper générique pour afficher un badge ────────────────────────────────
// usage : <Pill config={PRIORITY_CONFIG} value={ticket.priority} />