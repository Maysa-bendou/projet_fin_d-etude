export const PRIORITY_CLASS = {
  high:     "bg-red-100 text-red-700 border border-red-200",
  critical: "bg-red-200 text-red-800 border border-red-300",
  medium:   "bg-amber-100 text-amber-700 border border-amber-200",
  low:      "bg-green-100 text-green-700 border border-green-200",
};

export const PRIORITY_FR = { high:"Haute", critical:"Critique", medium:"Normale", low:"Basse" };
export const IMPACT_FR   = { high:"Haute", medium:"Moyen", low:"Faible" };
export const URGENCY_FR  = { high:"Urgente", medium:"Normale", low:"Faible" };
export const CATEGORY_FR = { hardware:"Hardware", software:"Logiciels", network:"Réseau", access:"Accès", security:"Sécurité", account:"Compte" };
export const TYPE_FR     = { incident:"Incident", service_request:"Demande de service", change:"Changement", problem:"Problème" };

export const STATUS_CLASS = {
  open:"bg-blue-100 text-blue-700 border border-blue-200",
  in_progress:"bg-amber-100 text-amber-700 border border-amber-200",
  pending:"bg-purple-100 text-purple-700 border border-purple-200",
  pending_supplier:"bg-orange-100 text-orange-700 border border-orange-200",
  resolved:"bg-green-100 text-green-700 border border-green-200",
  closed:"bg-gray-200 text-gray-600 border border-gray-300",
  rejected:"bg-red-100 text-red-700 border border-red-200",
};

export const STATUS_FR = {
  open:"Ouvert", in_progress:"En cours", pending:"En attente",
  pending_supplier:"Att. fournisseur", resolved:"Résolu", closed:"Fermé", rejected:"Rejeté",
};

export const CATEGORIES_EN = ["hardware","software","network","access","security","account"];

export const ACT_DOT = {
  assigned:"bg-blue-400", solution:"bg-blue-500", info:"bg-amber-500",
  redirect:"bg-pink-500", confirm:"bg-green-500", emp_reply:"bg-gray-400",
  confirmed:"bg-green-600", rejected_confirm:"bg-red-500", status:"bg-purple-500",
  comment:"bg-gray-300",
};

export const ACT_LABEL = {
  assigned:         "Ticket assigné",
  solution:         "Solution envoyée, confirmation en attente",
  info:             "Demande d'info envoyée à l'employé",
  redirect:         "Ticket redirigé",
  confirm:          "Demande de confirmation envoyée",
  emp_reply:        "Réponse de l'employé",
  confirmed:        "Résolution confirmée par l'employé",
  rejected_confirm: "L'employé a refusé la solution",
  comment:          "Note ajoutée",
};

export const ACT_META = {
  assigned:         { dot: "bg-blue-400",   label: "Ticket assigné",       icon: "user-check"   },
  solution:         { dot: "bg-blue-500",   label: "Solution",             icon: "clock"        },
  info:             { dot: "bg-amber-500",  label: "Demande d'info",       icon: "alert-circle" },
  confirm:          { dot: "bg-green-500",  label: "Confirmation",         icon: "check-circle" },
  emp_reply:        { dot: "bg-gray-400",   label: "Réponse employé",      icon: "trending-up"  },
  confirmed:        { dot: "bg-green-600",  label: "Résolution confirmée", icon: "check-circle" },
  rejected_confirm: { dot: "bg-red-500",    label: "Solution refusée",     icon: "x-circle"     },
  redirect:         { dot: "bg-pink-500",   label: "Redirection",          icon: "corner-up-right" },
  status:           { dot: "bg-purple-400", label: "Changement statut",    icon: "calendar"     },
  comment:          { dot: "bg-gray-300",   label: "Note interne",         icon: "align-left"   },
};