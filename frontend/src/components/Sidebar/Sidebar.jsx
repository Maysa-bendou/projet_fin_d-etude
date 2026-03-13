import React, { useState } from "react";

import logo from "../../assets/Logo_Djezzy.png";
import { Link } from "react-router-dom";

// icons
import { MdOutlineMenuOpen } from "react-icons/md";
import { FaHome } from "react-icons/fa";
const menuItems = [
  { icon: "", label: "Dashboard", path: "/app" },            // default home page
  { icon: "", label: "Creer Ticket", path: "/app/create-ticket" },
  { icon: "", label: "Mes Tickets", path: "/app/mes-tickets" },
  { icon: "", label: "Historique", path: "/app/historique" },
  { icon: "", label: "Profile", path: "/app/profile" },
  { icon: "", label: "Se deconnecter", path: "/" },         // back to login
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="shadow-md h-screen w-64 bg-black text-white">
      
      {/* Header */}
      <div className="border-b px-3 py-2 h-20 flex items-center justify-between">
        <img src={logo} alt="Logo" className="w-10" />
        <MdOutlineMenuOpen
          size={34}
          className="cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

   <ul className="mt-4">
  {menuItems.map((item, index) => (
    <li
      key={index}
      className="px-3 py-3 hover:bg-gray-700 cursor-pointer"
    >
      {item.label === "Se deconnecter" ? (
        <Link
          to={item.path}
          className="block"
          onClick={() => localStorage.removeItem("role")}
        >
          {item.label}
        </Link>
      ) : (
        <Link to={item.path} className="block">{item.label}</Link>
      )}
    </li>
  ))}
</ul>

    </nav>
  );
} 