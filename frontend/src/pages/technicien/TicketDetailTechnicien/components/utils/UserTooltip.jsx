import { useState } from "react";
import { Mail, Phone, User } from "lucide-react";

export default function UserTooltip({ user, children }) {
  const [show, setShow] = useState(false);
  if (!user) return children;
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-56 bg-gray-900 text-white rounded-xl shadow-xl p-3 text-[11px]">
          <p className="font-bold text-[13px] mb-1">{user.name} {user.surname}</p>
          {user.email && <p className="flex items-center gap-1.5 text-gray-300 mt-0.5"><Mail size={10}/>{user.email}</p>}
          {user.phone && <p className="flex items-center gap-1.5 text-gray-300 mt-0.5"><Phone size={10}/>{user.phone}</p>}
          {user.role && <p className="flex items-center gap-1.5 text-gray-400 mt-0.5 capitalize"><User size={10}/>{user.role}</p>}
          <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"/>
        </div>
      )}
    </div>
  );
}

