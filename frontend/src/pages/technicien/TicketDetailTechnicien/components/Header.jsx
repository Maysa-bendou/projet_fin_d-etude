import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Header({ 
  ticket, 
  allIds, 
  idx, 
  prevId, 
  nextId, 
  goToTicket,
  navigate 
}) {
  const { t } = useTranslation("technicien");

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2 text-sm">
        <button 
          onClick={() => navigate("/technician/tickets-assignes")}
          className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition bg-transparent border-none cursor-pointer p-0 font-medium"
        >
          <ArrowLeft size={15}/> {t("components.header.assignedTickets")}
        </button>
        <ChevronRight size={13} className="text-gray-300"/>
        <span className="text-gray-800 font-semibold truncate max-w-xs sm:max-w-md">
          T n°{ticket.id} — {ticket.title}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button 
          disabled={!prevId} 
          onClick={() => goToTicket(prevId)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={13}/> {t("components.header.previous")}
        </button>
        {idx >= 0 && (
          <span className="text-xs text-gray-400 font-mono">
            {idx+1}/{allIds.length}
          </span>
        )}
        <button 
          disabled={!nextId} 
          onClick={() => goToTicket(nextId)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {t("components.header.next")} <ChevronRight size={13}/>
        </button>
      </div>
    </div>
  );
}