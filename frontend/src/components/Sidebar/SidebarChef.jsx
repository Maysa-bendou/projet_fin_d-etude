import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  PieChart, 
  User, 
  LogOut, 
  ChevronRight, 
  ChevronLeft 
} from "lucide-react";

// --- COMPOSANT LOGO DJEZZY RÉALISTE ---
const DjezzyLogo = ({ isOpen }) => (
  <div className={`relative transition-all duration-500 flex items-center justify-center ${isOpen ? "w-36 h-20" : "w-16 h-12"}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      <path 
        d="M 15 85 L 85 50 L 15 15 Z" 
        fill="#ff0113" 
        strokeLinejoin="round" 
        strokeWidth="10" 
        stroke="#ff0113" 
      />
      <text x="18" y="50" fill="white" fontSize="12" fontWeight="black" fontFamily="Arial, sans-serif">
        DJEZZY
      </text>
      <text x="18" y="70" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif">
        جازی
      </text>
    </svg>
  </div>
);

export default function SidebarChef() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Menu spécifique pour le Chef de Service
  const menuItems = [
    { 
      icon: BarChart3, 
      label: "Statistiques global", 
      path: "/chef/statistiques",
      hasNotify: true // Le petit badge rouge sur l'icône
    },
    { icon: PieChart, label: "Répartition services", path: "/chef/repartition" },
    { icon: User,     label: "Profil",               path: "/chef/profile" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className={`
      relative flex flex-col h-[96vh] my-[2vh] ml-[2vh]
      transition-all duration-500 ease-in-out rounded-[2.5rem] py-6 shrink-0 z-50
      bg-white text-gray-800 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]
      ${isOpen ? "w-64" : "w-20"}
    `}>
      
      {/* ── LOGO ── */}
      <div className="flex items-center justify-center mb-10">
        <DjezzyLogo isOpen={isOpen} />
      </div>

      {/* ── BOUTON FLÈCHE ── */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-4 top-10 w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-md hover:text-[#ff0113] transition-all z-[60]"
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* ── MENU CHEF ── */}
      <div className="flex flex-col gap-6 w-full flex-1 items-center px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                group relative flex items-center transition-all duration-300 rounded-2xl
                ${isOpen ? "w-full px-5 py-3.5 gap-4" : "w-16 h-16 justify-center"}
                ${isActive
                  ? "bg-[#fff5f5] text-[#ff0113]" 
                  : "text-gray-400 hover:bg-gray-50"
                }
              `}
            >
              {/* Tooltip (Menu réduit) */}
              {!isOpen && (
                <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 z-[70] origin-left">
                   <div className="bg-[#fff5f5] text-[#ff0113] text-[12px] font-bold px-3 py-2 rounded-lg shadow-sm border border-red-50 whitespace-nowrap">
                     {item.label}
                   </div>
                </div>
              )}

              {/* Indicateur vertical à gauche (image_5e4524.png) */}
              {isActive && isOpen && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-[#ff0113] rounded-r-full" />
              )}
              
              {/* ICÔNE + BADGE DE NOTIFICATION (image_5202da.png) */}
              <div className="relative flex items-center justify-center shrink-0">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                
                {item.hasNotify && (
                  <span className={`
                    absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#ff0113]
                    border-2 border-white
                    ${isActive ? "border-[#fff5f5]" : "border-white"}
                  `} />
                )}
              </div>
              
              {isOpen && (
                <span className={`text-sm font-bold truncate ${isActive ? "text-gray-900" : "text-gray-500"}`}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* ── DÉCONNEXION ── */}
      <div className="pt-4 border-t border-gray-50 flex justify-center">
        <button 
          onClick={handleLogout}
          className={`
            group relative flex items-center text-gray-400 hover:text-[#ff0113] transition-colors
            ${isOpen ? "w-full px-8 py-4 gap-4" : "w-12 h-12 justify-center"}
          `}
        >
          {!isOpen && (
            <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left">
               <div className="bg-red-50 text-red-600 text-[12px] font-bold px-3 py-2 rounded-lg shadow-sm">
                 Quitter
               </div>
            </div>
          )}
          <LogOut size={24} />
          {isOpen && <span className="text-sm font-bold">Déconnexion</span>}
        </button>
      </div>
    </div>
  );
}