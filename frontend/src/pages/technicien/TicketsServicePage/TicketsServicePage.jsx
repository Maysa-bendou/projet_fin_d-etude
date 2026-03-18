import { useNavigate } from "react-router-dom";

const tickets = [
  {
    id: "TK-1042",
    title: "VPN access failure after password reset",
    employee: "R. Martinez",
    category: "Network / VPN",
    priority: "High",
    status: "Open",
    time: "3h ago",
  },
  {
    id: "TK-1041",
    title: "Outlook not syncing emails since this morning",
    employee: "S. Haddad",
    category: "Email / Outlook",
    priority: "Medium",
    status: "In progress",
    time: "5h ago",
  },
  {
    id: "TK-1040",
    title: "Printer offline in room B-204",
    employee: "A. Kaci",
    category: "Hardware / Print",
    priority: "Low",
    status: "Waiting on user",
    time: "1d ago",
  },
  {
    id: "TK-1039",
    title: "Cannot access shared drive after account migration",
    employee: "K. Bensaid",
    category: "Storage / Files",
    priority: "High",
    status: "Open",
    time: "2d ago",
  },
  {
    id: "TK-1038",
    title: "Teams audio not working during calls",
    employee: "L. Amrani",
    category: "Collaboration / Teams",
    priority: "Medium",
    status: "Resolved",
    time: "3d ago",
  },
];

const priorityStyles = {
  High: "bg-red-50 text-red-700 border border-red-200",
  Medium: "bg-amber-50 text-amber-700 border border-amber-200",
  Low: "bg-green-50 text-green-700 border border-green-200",
};

const statusStyles = {
  Open: "bg-blue-50 text-blue-700 border border-blue-200",
  "In progress": "bg-amber-50 text-amber-700 border border-amber-200",
  "Waiting on user": "bg-gray-100 text-gray-600 border border-gray-200",
  Resolved: "bg-green-50 text-green-700 border border-green-200",
};

export default function TicketsServicePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f0ede6] p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 tracking-widest uppercase mb-1">
              IT Support Portal
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">
              My Tickets
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full font-medium">
              7 open
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
              KB
            </div>
          </div>
        </div>
      </div>

      {/* Ticket list */}
      <div className="max-w-5xl mx-auto flex flex-col gap-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-white border border-black/[0.08] rounded-xl px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-shadow duration-150"
          >
            {/* ID */}
            <span className="text-xs font-mono text-gray-400 w-16 shrink-0">
              #{ticket.id}
            </span>

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {ticket.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {ticket.employee} · {ticket.category} · {ticket.time}
              </p>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${priorityStyles[ticket.priority]}`}>
                {ticket.priority}
              </span>
              <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${statusStyles[ticket.status]}`}>
                {ticket.status}
              </span>
            </div>

            {/* Voir détail button */}
            <button
              onClick={() => navigate(`/technician/tickets-service/${ticket.id}`)}
              className="shrink-0 text-xs font-medium px-4 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors duration-150 flex items-center gap-1.5"
            >
              Voir détail
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="opacity-70">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}