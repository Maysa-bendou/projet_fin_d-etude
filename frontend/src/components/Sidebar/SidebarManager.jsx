import React from "react";
import { Link, useLocation } from "react-router-dom";
// ── Pages du manager ──────────────────────────────
import { 
  MdDashboard, 
  MdPerson, 
  MdLogout, 
  MdBarChart, 
  MdPieChart, 
  MdAssignment,
  MdBuild   // ✅ ADD THIS
} from "react-icons/md";

const menuItems = [
  { icon: MdDashboard,  label: "Vue globale",          path: "/manager" },

  // ✅ NEW PAGE (THIS IS YOUR FIX)
  { icon: MdBuild,      label: "Tickets du service",   path: "/manager/tickets-service" },

  { icon: MdBarChart,   label: "Suivi performances",   path: "/manager/performances" },
  { icon: MdPieChart,   label: "Répartition services", path: "/manager/repartition" },
  { icon: MdAssignment, label: "Gestion affectations", path: "/manager/affectations" },
  { icon: MdPerson,     label: "Profil",               path: "/manager/profile" },
];

export default function SidebarManager() {
  const location = useLocation();

  return (
    <div className="
      group flex flex-col
      h-screen
      bg-white shadow-xl
      py-5 px-2
      w-16 hover:w-56
      transition-all duration-300 overflow-hidden
      shrink-0
    ">

      {/* ── Logo ── */}
      <div className="flex items-center w-full px-2 mb-8 gap-3">
        <div className="shrink-0 w-10 h-10 flex items-center justify-center">
          <svg width="40" height="36" viewBox="0 0 40 36">
            <polygon points="2,2 2,34 38,18" fill="#e40c0c" />
            <text x="14" y="16" textAnchor="middle"
              fill="white" fontSize="6" fontWeight="bold">DJEZZY</text>
            <text x="14" y="25" textAnchor="middle"
              fill="white" fontSize="6">جازي</text>
          </svg>
        </div>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold text-red-600 text-base whitespace-nowrap">
          DJEZZY
        </span>
      </div>

      {/* ── Items du menu ── */}
      <div className="flex flex-col gap-1 w-full px-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <div key={item.path} className="relative group/item">
              <Link
                to={item.path}
                className={`
                  flex items-center gap-3
                  w-full px-2 py-2.5 rounded-xl
                  transition-all duration-200
                  ${isActive
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:bg-blue-50 hover:text-blue-500"
                  }
                `}
              >
                <Icon size={20} className="shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              </Link>

              {/* Tooltip quand sidebar fermée */}
              <span className="
                absolute left-14 top-1/2 -translate-y-1/2
                bg-gray-800 text-white text-xs
                px-2.5 py-1.5 rounded-lg whitespace-nowrap
                opacity-0 group-hover/item:opacity-100
                group-hover:hidden
                transition-opacity duration-150
                pointer-events-none z-50
              ">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Déconnexion ── */}
      <div className="relative group/item w-full px-1 mt-2">
        <Link
          to="/"
          onClick={() => localStorage.removeItem("role")}
          className="
            flex items-center gap-3
            w-full px-2 py-2.5 rounded-xl
            text-gray-400 hover:bg-red-50 hover:text-red-500
            transition-all
          "
        >
          <MdLogout size={20} className="shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap">
            Déconnexion
          </span>
        </Link>

        <span className="
          absolute left-14 top-1/2 -translate-y-1/2
          bg-gray-800 text-white text-xs
          px-2.5 py-1.5 rounded-lg whitespace-nowrap
          opacity-0 group-hover/item:opacity-100
          group-hover:hidden
          transition-opacity duration-150
          pointer-events-none z-50
        ">
          Déconnexion
        </span>
      </div>

    </div>
  );
}