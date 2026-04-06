import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  User,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  Ticket,
} from "lucide-react";

const ROLE_LABEL = {
  technician:   "Technicien",
  technicien:   "Technicien",
  manager:      "Manager",
  chef_service: "Chef de service",
  employee:     "Employé",
  admin:        "Administrateur",
};

const ROLE_PATH = {
  technician:   "technician",
  technicien:   "technician",
  manager:      "manager",
  chef_service: "chef",
  employee:     "employee",
  admin:        "admin",
};

// ── Icône et couleur selon le type de notification ────────────────────────
function getNotifMeta(type) {
  switch (type) {
    case "assigned":         return { icon: Ticket,        color: "text-blue-600 bg-blue-50"   };
    case "sla":              return { icon: AlertCircle,   color: "text-red-600 bg-red-50"     };
    case "solution":         return { icon: CheckCircle2,  color: "text-green-600 bg-green-50" };
    case "info":             return { icon: Info,          color: "text-amber-600 bg-amber-50" };
    case "status":           return { icon: Clock,         color: "text-purple-600 bg-purple-50" };
    case "emp_reply":        return { icon: Info,          color: "text-amber-600 bg-amber-50" };
    case "confirmed":        return { icon: CheckCircle2,  color: "text-green-600 bg-green-50" };
    case "rejected_confirm": return { icon: AlertCircle,   color: "text-red-600 bg-red-50"     };
    case "new_ticket":       return { icon: Ticket,        color: "text-blue-600 bg-blue-50"   };
    case "updated":          return { icon: Info,          color: "text-amber-600 bg-amber-50" };
    default:                 return { icon: Info,          color: "text-gray-600 bg-gray-50"   };
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
  const navigate    = useNavigate();
  const user        = JSON.parse(localStorage.getItem("user") || "null");
  const rolePath    = ROLE_PATH[user?.role] || "";
  const roleLabel   = ROLE_LABEL[user?.role] || user?.role || "";
  const initials    = `${user?.name?.[0] || "?"}${user?.surname?.[0] || ""}`.toUpperCase();

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs,      setNotifs]      = useState([]);

  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  useOnClickOutside(notifRef,   () => setNotifOpen(false));
  useOnClickOutside(profileRef, () => setProfileOpen(false));

  // ── Polling notifications ─────────────────────────────────────────────
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

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-5 h-14 gap-4">

        {/* ── Titre page ── */}
        <div className="flex items-center gap-3 min-w-0">
          {pageTitle && (
            <h1 className="text-sm font-semibold text-gray-800 truncate hidden sm:block">
              {pageTitle}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">

          {/* ── Notifications ── */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition bg-transparent border-none cursor-pointer"
              title="Notifications"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">Notifications</span>
                    {unread > 0 && (
                      <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                        {unread}
                      </span>
                    )}
                  </div>
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Tout marquer lu
                    </button>
                  )}
                </div>

                {/* Liste */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifs.length === 0 ? (
                    <p className="text-center text-gray-400 text-[12px] py-8">Aucune notification</p>
                  ) : (
                    notifs.map(n => {
                      const { icon: Icon, color } = getNotifMeta(n.type);
                      return (
                        <button
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition cursor-pointer bg-transparent border-none
                            ${!n.is_read ? "bg-blue-50/40" : ""}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-[12px] font-semibold leading-tight ${!n.is_read ? "text-gray-900" : "text-gray-700"}`}>
                                {n.message}
                              </p>
                              {!n.is_read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                  <button className="text-[11px] text-blue-600 hover:underline bg-transparent border-none cursor-pointer">
                    Voir toutes les notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Profil ── */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition bg-transparent border-none cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-[12px] font-semibold text-gray-800 leading-tight">
                  {user?.name} {user?.surname}
                </span>
                <span className="text-[10px] text-gray-400 leading-tight">{roleLabel}</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-11 w-52 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-white border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">
                        {user?.name} {user?.surname}
                      </p>
                      <p className="text-[10px] text-gray-400">{roleLabel}</p>
                    </div>
                  </div>
                </div>
                <div className="py-1.5">
                  <button
                    onClick={() => { navigate(`/${rolePath}/profile`); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 transition bg-transparent border-none cursor-pointer text-left"
                  >
                    <User size={14} className="text-gray-400" />
                    Mon profil
                  </button>
                </div>
                <div className="border-t border-gray-100 py-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-red-600 hover:bg-red-50 transition bg-transparent border-none cursor-pointer text-left"
                  >
                    <LogOut size={14} className="text-red-500" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}