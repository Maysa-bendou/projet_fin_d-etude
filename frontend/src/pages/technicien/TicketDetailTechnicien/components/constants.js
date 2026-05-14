// ─── Styling constants (no labels — unchanged) ────────────────────────────────

export const PRIORITY_CLASS = {
  high:     "bg-red-100 text-red-700 border border-red-200",
  critical: "bg-red-200 text-red-800 border border-red-300",
  medium:   "bg-amber-100 text-amber-700 border border-amber-200",
  low:      "bg-green-100 text-green-700 border border-green-200",
};

export const STATUS_CLASS = {
  open:             "bg-blue-100 text-blue-700 border border-blue-200",
  in_progress:      "bg-amber-100 text-amber-700 border border-amber-200",
  pending:          "bg-purple-100 text-purple-700 border border-purple-200",
  pending_supplier: "bg-orange-100 text-orange-700 border border-orange-200",
  resolved:         "bg-green-100 text-green-700 border border-green-200",
  closed:           "bg-gray-200 text-gray-600 border border-gray-300",
  rejected:         "bg-red-100 text-red-700 border border-red-200",
};

export const CATEGORIES_EN = ["hardware", "software", "network", "access", "security", "account"];


export const PRIORITY_KEYS = {
  high:     "constants.priority.high",
  critical: "constants.priority.critical",
  medium:   "constants.priority.medium",
  low:      "constants.priority.low",
};

export const IMPACT_KEYS = {
  high:   "constants.impact.high",
  medium: "constants.impact.medium",
  low:    "constants.impact.low",
};

export const URGENCY_KEYS = {
  high:   "constants.urgency.high",
  medium: "constants.urgency.medium",
  low:    "constants.urgency.low",
};

export const CATEGORY_KEYS = {
  hardware: "constants.category.hardware",
  software: "constants.category.software",
  network:  "constants.category.network",
  access:   "constants.category.access",
  security: "constants.category.security",
  account:  "constants.category.account",
};

export const TYPE_KEYS = {
  incident:        "constants.type.incident",
  service_request: "constants.type.service_request",
  change:          "constants.type.change",
  problem:         "constants.type.problem",
};

export const STATUS_KEYS = {
  open:             "constants.status.open",
  in_progress:      "constants.status.in_progress",
  pending:          "constants.status.pending",
  pending_supplier: "constants.status.pending_supplier",
  resolved:         "constants.status.resolved",
  closed:           "constants.status.closed",
  rejected:         "constants.status.rejected",
};

// ─── ACT_DOT (no labels — unchanged) ─────────────────────────────────────────

export const ACT_DOT = {
  assigned:         "bg-blue-400",
  solution:         "bg-blue-500",
  info:             "bg-amber-500",
  redirect:         "bg-pink-500",
  confirm:          "bg-green-500",
  emp_reply:        "bg-gray-400",
  confirmed:        "bg-green-600",
  rejected_confirm: "bg-red-500",
  status:           "bg-purple-500",
  comment:          "bg-gray-300",
};

// ─── ACT_LABEL → keys ─────────────────────────────────────────────────────────
// Usage:  t(ACT_LABEL_KEYS[item.type])

export const ACT_LABEL_KEYS = {
  assigned:         "constants.actLabel.assigned",
  solution:         "constants.actLabel.solution",
  info:             "constants.actLabel.info",
  redirect:         "constants.actLabel.redirect",
  confirm:          "constants.actLabel.confirm",
  emp_reply:        "constants.actLabel.emp_reply",
  confirmed:        "constants.actLabel.confirmed",
  rejected_confirm: "constants.actLabel.rejected_confirm",
  comment:          "constants.actLabel.comment",
};


export const ACT_META = {
  assigned:         { dot: "#60a5fa",  labelKey: "constants.actMeta.assigned",        icon: "user-check"      },
  solution:         { dot: "#3b82f6",  labelKey: "constants.actMeta.solution",         icon: "clock"           },
  info:             { dot: "#f59e0b",  labelKey: "constants.actMeta.info",             icon: "alert-circle"    },
  confirm:          { dot: "#22c55e",  labelKey: "constants.actMeta.confirm",          icon: "check-circle"    },
  emp_reply:        { dot: "#9ca3af",  labelKey: "constants.actMeta.emp_reply",        icon: "trending-up"     },
  confirmed:        { dot: "#16a34a",  labelKey: "constants.actMeta.confirmed",        icon: "check-circle"    },
  rejected_confirm: { dot: "#ef4444",  labelKey: "constants.actMeta.rejected_confirm", icon: "x-circle"        },
  redirect:         { dot: "#ec4899",  labelKey: "constants.actMeta.redirect",         icon: "corner-up-right" },
  status:           { dot: "#a78bfa",  labelKey: "constants.actMeta.status",           icon: "calendar"        },
  comment:          { dot: "#d1d5db",  labelKey: "constants.actMeta.comment",          icon: "align-left"      },
  reopen:           { dot: "#15803d",  labelKey: "constants.actMeta.reopen",           icon: "corner-up-right" },
  update:           { dot: "#534ab7",  labelKey: "constants.actMeta.update",           icon: "align-left"      },
};