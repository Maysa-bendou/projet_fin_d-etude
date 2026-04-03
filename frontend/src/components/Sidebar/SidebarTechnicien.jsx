import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdAssignment,
  MdBuild,
  MdPerson,
  MdLogout
} from "react-icons/md";

const menuItems = [
  { icon: MdDashboard,  label: "Accueil",            path: "/technician" },
  { icon: MdAssignment, label: "Tickets assignés",   path: "/technician/tickets-assignes" },
  { icon: MdBuild,      label: "Tickets du service", path: "/technician/tickets-service" },
  { icon: MdPerson,     label: "Profil",             path: "/technician/profile" },
];

export default function SidebarTechnician() {
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
              fill="white" fontSize="6">جاري</text>
          </svg>
        </div>

        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold text-red-600 text-base whitespace-nowrap">
          DJEZZY
        </span>
      </div>

      {/* ── Menu ── */}
      <div className="flex flex-col gap-1 w-full px-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3
                w-full px-2 py-2.5 rounded-xl
                transition-all duration-200
                ${isActive
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }
              `}
            >
              <Icon size={20} className="shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── Déconnexion ── */}
      <div className="w-full px-1 mt-2">
        <Link
          to="/"
          onClick={() => localStorage.removeItem("role")}
          className="flex items-center justify-center gap-3 px-2 py-2.5 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all w-full"
        >
          <MdLogout size={20} />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap">
            Déconnexion
          </span>
        </Link>
      </div>

    </div>
  );
}