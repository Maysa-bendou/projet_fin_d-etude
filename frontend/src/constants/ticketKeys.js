// constants/ticketKeys.js

export const STATUS_KEYS = {
  open:             "status.open",
  in_progress:      "status.in_progress",
  pending:          "status.pending",
  pending_supplier: "status.pending_supplier",
  resolved:         "status.resolved",
  closed:           "status.closed",
  rejected:         "status.rejected",
};

export const CATEGORY_KEYS = {
  hardware:   "category.hardware",
  software:   "category.software",
  network:    "category.network",
  access:     "category.access",
  security:   "category.security",
  messagerie: "category.messagerie",
};

export const IMPACT_KEYS = {
  low:    "impact.low",
  medium: "impact.medium",
  high:   "impact.high",
};

export const URGENCY_KEYS = {
  low:    "urgency.low",
  medium: "urgency.medium",
  high:   "urgency.high",
};

export const PRIORITY_KEYS = {
  low:      "priority.low",
  medium:   "priority.medium",
  high:     "priority.high",
  critical: "priority.critical",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper — pass the raw DB value, get the translated label back.
// Works for any of the maps above.
//
// Example:
//   translateKey(t, STATUS_KEYS,   ticket.status)
//   translateKey(t, URGENCY_KEYS,  ticket.urgency)
//   translateKey(t, IMPACT_KEYS,   ticket.impact)
// ─────────────────────────────────────────────────────────────────────────────
export function translateKey(t, keyMap, rawValue) {
  const i18nKey = keyMap[rawValue];
  // Force lookup in "common" namespace where status/priority/category/etc. live
  return i18nKey ? t(i18nKey, { ns: "common" }) : rawValue;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve a safe BCP-47 locale tag from the translation file.
// t("date.locale") should return "fr-FR" or "en-GB".
// ─────────────────────────────────────────────────────────────────────────────
const VALID_LOCALE_RE = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/;

function safeLocale(t) {
  const tag = t("date.locale", { ns: "common" }); // force common namespace
  if (!tag || !VALID_LOCALE_RE.test(tag)) {
    return navigator.language || "fr-FR";
  }
  return tag;
}

// ─────────────────────────────────────────────────────────────────────────────
// Date helper — formats a date string according to the active language.
// Uses the locale stored in common.json → date.locale.
//
// Example:
//   formatDate(t, ticket.created_at)             // short  → "15/04/2025"
//   formatDate(t, ticket.created_at, 'long')     // long   → "15 avril 2025"
//   formatDate(t, ticket.created_at, 'relative') // → relative string
// ─────────────────────────────────────────────────────────────────────────────
export function formatDate(t, dateStr, format = "short") {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date)) return "—";

  const locale = safeLocale(t);

  if (format === "relative") {
    const diff = Date.now() - date.getTime();
    const m    = Math.floor(diff / 60000);
    const h    = Math.floor(diff / 3600000);
    const d    = Math.floor(diff / 86400000);
    if (m < 1)   return t("date.relative.justNow",    { ns: "common" });
    if (m < 60)  return t("date.relative.minutesAgo", { ns: "common", count: m });
    if (h < 24)  return t("date.relative.hoursAgo",   { ns: "common", count: h });
    if (d === 1) return t("date.relative.yesterday",   { ns: "common" });
    return t("date.relative.daysAgo", { ns: "common", count: d });
  }

  if (format === "long") {
    return date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  }

// Après
if (format === "withTime") {
  return date.toLocaleString(locale, {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

// Après
if (format === "timeOnly") {
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
}

  // default: short → "15/04/2025" or "04/15/2025"
  return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
}