import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, ChevronDown, User, LogOut, CheckCircle2,
  AlertCircle, Clock, Info, Ticket, Languages,Forward,
} from "lucide-react";

const ROLE_LABEL = {
  technician: "Technicien", technicien: "Technicien",
  manager: "Manager", chef_service: "Chef de service",
  employee: "Employé", admin: "Administrateur",
};

const ROLE_PATH = {
  technician: "technician", technicien: "technician",
  manager: "manager", chef_service: "chef",
  employee: "employee", admin: "admin",
};

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English",  flag: "🇬🇧" },
];

function getNotifMeta(type) {
  switch (type) {
    case "assigned":         return { icon: Ticket,       color: "text-blue-600 bg-blue-50"     };
    case "sla":              return { icon: AlertCircle,  color: "text-red-600 bg-red-50"       };
    case "solution":         return { icon: CheckCircle2, color: "text-green-600 bg-green-50"   };
    case "info":             return { icon: Info,         color: "text-amber-600 bg-amber-50"   };
    case "status":           return { icon: Clock,        color: "text-purple-600 bg-purple-50" };
    case "emp_reply":        return { icon: Info,         color: "text-amber-600 bg-amber-50"   };
    case "confirmed":        return { icon: CheckCircle2, color: "text-green-600 bg-green-50"   };
    case "rejected_confirm": return { icon: AlertCircle,  color: "text-red-600 bg-red-50"       };
    case "new_ticket":       return { icon: Ticket,       color: "text-blue-600 bg-blue-50"     };
    case "updated":          return { icon: Info,         color: "text-amber-600 bg-amber-50"   };
    case "redirect":         return { icon: Forward,      color: "text-purple-600 bg-purple-50" }; // ← ici
    default:                 return { icon: Info,         color: "text-gray-600 bg-gray-50"     };
  }
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${d}j`;
}

function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

export default function TopNavbar({ pageTitle = "" }) {
  const navigate   = useNavigate();
  const user       = JSON.parse(localStorage.getItem("user") || "null");
  const rolePath   = ROLE_PATH[user?.role] || "";
  const roleLabel  = ROLE_LABEL[user?.role] || user?.role || "";
  const initials   = `${user?.name?.[0] || "?"}${user?.surname?.[0] || ""}`.toUpperCase();

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen,    setLangOpen]    = useState(false);
  const [activeLang,  setActiveLang]  = useState(LANGUAGES[0]);
  const [notifs,      setNotifs]      = useState([]);
  const [time,        setTime]        = useState(new Date());

  const notifRef   = useRef(null);
  const profileRef = useRef(null);
  const langRef    = useRef(null);

  useOnClickOutside(notifRef,   () => setNotifOpen(false));
  useOnClickOutside(profileRef, () => setProfileOpen(false));
  useOnClickOutside(langRef,    () => setLangOpen(false));

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/notifications/${user.id}`);
        if (res.ok) setNotifs(await res.json());
      } catch (_) {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const unread = notifs.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await fetch(`http://localhost:3001/api/notifications/read-all/${user.id}`, { method: "PUT" });
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (_) {}
  };

  const markRead = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/notifications/${id}/read`, { method: "PUT" });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (_) {}
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const closeAll = () => { setNotifOpen(false); setProfileOpen(false); setLangOpen(false); };

  return (
    <header className="w-full px-6 py-4" style={{ backgroundColor: "#f9f6f2" }}>
      <div className="flex items-center justify-between bg-white px-8 h-16 rounded-[40px] border border-[#e2e8f0] shadow-sm">

        {/* ── GAUCHE ── */}
        <div className="flex items-center gap-6">
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-r border-slate-100 pr-6">
            Support Panel
          </span>
          <div className="flex items-center gap-2 text-slate-500">
            
          </div>
        </div>

        {/* ── DROITE ── */}
        <div className="flex items-center gap-4">

          {/* ── Language Switcher ── */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => { closeAll(); setLangOpen(v => !v); }}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all cursor-pointer border border-slate-100 bg-transparent"
              title="Langue"
            >
              <Languages size={16} />
              <span className="text-xs font-bold uppercase">{activeLang.code}</span>
              <ChevronDown size={12} className={`text-slate-300 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-3 w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 p-1.5">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setActiveLang(lang); setLangOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition border-none cursor-pointer
                      ${activeLang.code === lang.code
                        ? "bg-blue-50 text-blue-600 font-bold"
                        : "bg-transparent text-slate-600 hover:bg-slate-50"}`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span className="font-semibold">{lang.label}</span>
                    {activeLang.code === lang.code && (
                      <CheckCircle2 size={13} className="ml-auto text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-[1px] h-8 bg-slate-100 mx-1" />

          {/* ── Notifications ── */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { closeAll(); setNotifOpen(v => !v); }}
              className="relative p-2.5 rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all cursor-pointer border-none bg-transparent"
              title="Notifications"
            >
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">Notifications</span>
                    {unread > 0 && (
                      <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{unread}</span>
                    )}
                  </div>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-[11px] text-blue-600 hover:underline bg-transparent border-none cursor-pointer font-semibold">
                      Tout marquer lu
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">Aucune notification</div>
                  ) : (
                    notifs.map(n => {
                      const { icon: Icon, color } = getNotifMeta(n.type);
                      return (
                        <button
                          key={n.id}
                   onClick={() => {
  markRead(n.id);
  setNotifOpen(false);
  if (n.ticket_id) {
    if (rolePath === "technician") {
      // assigned = ticket assigné directement → détail technicien
      // tout le reste (new_ticket, redirect, etc.) → liste service
      const path = n.type === "assigned"
        ? `/technician/ticket-technicien/${n.ticket_id}`
        : `/technician/tickets-service/${n.ticket_id}`;
      navigate(path);
    } else if (rolePath === "manager" || rolePath === "chef") {
      navigate(`/manager/tickets-service/${n.ticket_id}`);
    } else if (rolePath === "employee") {
      navigate(`/employee/ticket/${n.ticket_id}`);
    }
  }
}} className={`w-full flex gap-3 px-5 py-4 text-left hover:bg-slate-50 transition border-none bg-transparent cursor-pointer ${!n.is_read ? "bg-blue-50/30" : ""}`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs leading-snug ${!n.is_read ? "font-bold text-slate-900" : "text-slate-600"}`}>{n.message}</p>
                              {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{formatTime(n.created_at)}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

              
              </div>
            )}
          </div>

          <div className="w-[1px] h-8 bg-slate-100 mx-1" />

          {/* ── Profil ── */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { closeAll(); setProfileOpen(v => !v); }}
              className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border-none bg-transparent"
            >
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 leading-none">{user?.name} {user?.surname}</span>
                <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{roleLabel}</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-lg shadow-blue-100">
                {initials}
              </div>
              <ChevronDown size={14} className={`text-slate-300 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 p-2">
                <button
                  onClick={() => { navigate(`/${rolePath}/profile`); setProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition border-none bg-transparent cursor-pointer"
                >
                  <User size={16} />
                  <span className="font-semibold">Mon Profil</span>
                </button>
                <div className="h-[1px] bg-slate-50 my-1 mx-2" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-red-500 hover:bg-red-50 transition border-none bg-transparent cursor-pointer"
                >
                  <LogOut size={16} />
                  <span className="font-semibold">Déconnexion</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}