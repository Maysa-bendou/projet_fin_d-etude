import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X, Ticket, User, LogOut, ChevronDown } from "lucide-react";

const MOCK_NOTIFS = [
  { id: 1, title: "Nouveau ticket", time: "5m" },
  { id: 2, title: "SLA dépassé", time: "22m" },
  { id: 3, title: "Ticket mis à jour", time: "1h" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const goToProfile = () => {
    const rolePath = user?.role === 'chef_service' ? 'chef' : user?.role || 'employee';
    navigate(`/${rolePath}/profile`);
    setProfileOpen(false);
  };

  const handleNotifClick = () => {
    setIsVibrating(true);
    setNotifOpen(!notifOpen);
    setProfileOpen(false);
    setTimeout(() => setIsVibrating(false), 600);
  };

  useEffect(() => {
    const listener = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, []);

  return (
    <div className="p-2 w-full flex justify-center sticky top-0 z-40 bg-transparent">
      {/* Navbar simplifiée avec fond solide Djezzy */}
      <div className="flex items-center justify-end gap-5 px-8 py-2 h-16 bg-[#f5e7e8] rounded-full shadow-[0_10px_25px_-10px_rgba(227,29,43,0.2)] w-[98%] max-w-[1920px] mx-auto">
        
        {/* SECTION NOTIFICATIONS */}
        <div ref={notifRef} className="relative">
          <button
            onClick={handleNotifClick}
            className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#ff0113] shadow-sm hover:bg-[#ff0113] hover:text-white transition-all ${isVibrating ? "animate-wiggle" : ""}`}
          >
            <Bell size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ff0113] text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-white">3</span>
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
                <span className="text-xs font-bold text-gray-700">Notifications</span>
                <X size={14} className="cursor-pointer text-gray-400" onClick={() => setNotifOpen(false)} />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {MOCK_NOTIFS.map(n => (
                  <div key={n.id} className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition cursor-pointer border-b border-gray-50">
                    <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0"><Ticket size={12} /></div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-800">{n.title}</p>
                      <p className="text-[9px] text-gray-400">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION PROFIL */}
        <div ref={profileRef} className="relative">
          <button 
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-3 pl-5 border-l border-red-200 hover:opacity-80 transition-all cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-[12px] font-black text-gray-900 leading-none uppercase">
                {user?.nom || "ADMIN"} {user?.prenom || "DJEZZY"}
              </p>
              <p className="text-[9px] text-[#ff0113] font-bold mt-1 uppercase">
                {user?.role?.replace('_', ' ') || "MANAGER 5G"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff0113] to-[#d22d36] flex items-center justify-center shadow-md border-2 border-white text-white text-xs font-black">
              {user?.nom?.[0] || "A"}{user?.prenom?.[0] || "D"}
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
              <button onClick={goToProfile} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition text-left">
                <User size={16} className="text-gray-400" /> Mon Profil
              </button>
              <div className="h-[1px] bg-gray-100 my-1 mx-2"></div>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] text-red-600 hover:bg-red-50 transition text-left">
                <LogOut size={16} /> Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}