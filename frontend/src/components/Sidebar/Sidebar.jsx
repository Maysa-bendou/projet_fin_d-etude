
import React, { useState } from "react";

import logo from "../../assets/Logo_Djezzy.png";
// icons
import { MdOutlineMenuOpen } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import { MdSpaceDashboard } from "react-icons/md";
 
import { Link, useLocation } from "react-router-dom";
import { MdDashboard, MdAddCircle, MdHistory, MdPerson, MdLogout, MdMenu } from "react-icons/md";
import { FaTicketAlt } from "react-icons/fa";


const menuItems = [
  {icon: MdDashboard, label: "Dashboard", path: "/employee" },            
  { icon: MdAddCircle, label: "Creer Ticket", path: "/employee/create-ticket" },
  { icon: FaTicketAlt, label: "Mes Tickets", path: "/employee/mes-tickets" },
  { icon: MdPerson, label: "Profile", path: "/employee/profile" },
  { icon: MdLogout, label: "Se deconnecter", path: "/" },
];
export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex items-center justify-center h-screen px-3">

      {/* ── La sidebar ── */}
      {/* group → permet de détecter le survol de toute la sidebar */}
      <div className="
        group
        flex flex-col items-center
        bg-white rounded-3xl shadow-xl
        py-5 px-2
        w-16 hover:w-56
        transition-all duration-300 overflow-hidden
      ">

        {/* Logo + nom — nom caché par défaut visible au survol */}
        <div className="flex items-center w-full px-2 mb-4 gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">DZ</span>
          </div>
          {/* opacity-0 → caché, group-hover:opacity-100 → visible au survol */}
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold text-gray-800 whitespace-nowrap">
            DJEZZY
          </span>
        </div>

        {/* ── Items du menu ── */}
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
                {/* Point actif */}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 absolute left-2" />
                )}

                {/* Icône */}
                <Icon size={20} className="shrink-0" />

                {/* Label — caché par défaut visible au survol */}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── Photo profil + nom ── */}
        <div className="mt-4 border-t border-gray-100 pt-4 w-full px-2">
          <Link to="/app/profile" className="flex items-center gap-3">
            <div className="
              w-9 h-9 rounded-full shrink-0
              bg-gradient-to-br from-blue-500 to-purple-600
              flex items-center justify-center
            ">
              <span className="text-white text-xs font-bold">AH</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">Ahmed Hamza</p>
              <p className="text-xs text-gray-400 whitespace-nowrap">Employé</p>
            </div>
          </Link>
        </div>

        {/* ── Déconnexion ── */}
        <div className="w-full px-1 mt-2">
          <Link
            to="/"
            onClick={() => localStorage.removeItem("role")}
            className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all w-full"
          >
            <MdLogout size={20} className="shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap">
              Déconnexion
            </span>
          </Link>
        </div>

      </div>
    </div>
  );
}