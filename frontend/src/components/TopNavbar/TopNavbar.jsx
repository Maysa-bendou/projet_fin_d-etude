import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  Ticket,
} from "lucide-react";

// ── Mock notifications ────────────────────────────────────────────────────
const MOCK_NOTIFS = [
  {
    id: 1,
    type: "ticket",
    title: "Nouveau ticket assigné",
    message: "Le ticket #108 vous a été assigné par le manager.",
    time: "Il y a 5 min",
    read: false,
    icon: Ticket,
    color: "text-blue-600 bg-blue-50",
  },
  {
    id: 2,
    type: "alert",
    title: "SLA dépassé",
    message: "Le ticket #102 a dépassé son délai de résolution.",
    time: "Il y a 22 min",
    read: false,
    icon: AlertCircle,
    color: "text-red-600 bg-red-50",
  },
  {
    id: 3,
    type: "info",
    title: "Ticket mis à jour",
    message: "L'employé Sara Benali a répondu au ticket #97.",
    time: "Il y a 1h",
    read: true,
    icon: Info,
    color: "text-amber-600 bg-amber-50",
  },
  {
    id: 4,
    type: "success",
    title: "Ticket résolu",
    message: "Le ticket #95 a été marqué comme résolu.",
    time: "Il y a 3h",
    read: true,
    icon: CheckCircle2,
    color: "text-green-600 bg-green-50",
  },
  {
    id: 5,
    type: "info",
    title: "Rappel SLA",
    message: "Le ticket #101 expire dans 45 minutes.",
    time: "Il y a 4h",
    read: true,
    icon: Clock,
    color: "text-purple-600 bg-purple-50",
  },
];

// ── Role label ────────────────────────────────────────────────────────────
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

// ── useOnClickOutside ─────────────────────────────────────────────────────
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

// ── COMPONENT ─────────────────────────────────────────────────────────────
export default function TopNavbar({ pageTitle = "" }) {
  const navigate    = useNavigate();
  const user        = JSON.parse(localStorage.getItem("user") || "null");
  const rolePath    = ROLE_PATH[user?.role] || "";
  const roleLabel   = ROLE_LABEL[user?.role] || user?.role || "";
  const initials    = `${user?.name?.[0] || "?"}${user?.surname?.[0] || ""}`.toUpperCase();

  // ── State ────────────────────────────────────────────────────────────
  const [search,        setSearch]        = useState("");
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [notifs,        setNotifs]        = useState(MOCK_NOTIFS);

  const searchRef  = useRef(null);
  const notifRef   = useRef(null);
  const profileRef = useRef(null);
  const inputRef   = useRef(null);

  useOnClickOutside(searchRef,  () => { setSearchOpen(false); setSearch(""); });
  useOnClickOutside(notifRef,   () => setNotifOpen(false));
  useOnClickOutside(profileRef, () => setProfileOpen(false));

  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const markRead    = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Ouvrir search et focus input
  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-5 h-14 gap-4">

        {/* ── Titre page (gauche) ── */}
        <div className="flex items-center gap-3 min-w-0">
          {pageTitle && (
            <h1 className="text-sm font-semibold text-gray-800 truncate hidden sm:block">
              {pageTitle}
            </h1>
          )}
        </div>

        {/* ── Droite : search + notif + profil ── */}
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

            {/* Dropdown notifications */}
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
                  {notifs.map(n => {
                    const Icon = n.icon;
                    return (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition cursor-pointer bg-transparent border-none
                          ${!n.read ? "bg-blue-50/40" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.color}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-[12px] font-semibold leading-tight ${!n.read ? "text-gray-900" : "text-gray-700"}`}>
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                        </div>
                      </button>
                    );
                  })}
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
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
              {/* Nom + rôle */}
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

            {/* Dropdown profil */}
            {profileOpen && (
              <div className="absolute right-0 top-11 w-52 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                {/* Carte utilisateur */}
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

                {/* Actions */}
                <div className="py-1.5">
                  <button
                    onClick={() => { navigate(`/${rolePath}/profile`); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 transition bg-transparent border-none cursor-pointer text-left"
                  >
                    <User size={14} className="text-gray-400" />
                    Mon profil
                  </button>

                  {/* Paramètres removed per request */}

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