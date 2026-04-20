import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

export default function Header({ ticket, allIds, idx, prevId, nextId, goToTicket, navigate }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12, fontFamily: 'Inter, sans-serif',
      marginBottom: 4
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => navigate("/technician/tickets-assignes")}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9ca3af', fontSize: 12, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em', padding: 0,
            fontFamily: 'Inter, sans-serif'
          }}
        >
          <ArrowLeft size={14} /> Tickets Assignés
        </button>
        <ChevronRight size={13} color="#d1d5db" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          T n°{ticket.id} — {ticket.title}
        </span>
      </div>

      {/* Navigation prev/next */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          disabled={!prevId}
          onClick={() => goToTicket(prevId)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '7px 14px', borderRadius: 10,
            border: '1px solid #e5e7eb', background: '#fff',
            color: '#374151', fontSize: 12, fontWeight: 600,
            cursor: prevId ? 'pointer' : 'not-allowed',
            opacity: prevId ? 1 : 0.4, fontFamily: 'Inter, sans-serif'
          }}
        >
          <ChevronLeft size={13} /> Précédent
        </button>

        {idx >= 0 && (
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
            {idx + 1}/{allIds.length}
          </span>
        )}

        <button
          disabled={!nextId}
          onClick={() => goToTicket(nextId)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '7px 14px', borderRadius: 10,
            border: '1px solid #e5e7eb', background: '#fff',
            color: '#374151', fontSize: 12, fontWeight: 600,
            cursor: nextId ? 'pointer' : 'not-allowed',
            opacity: nextId ? 1 : 0.4, fontFamily: 'Inter, sans-serif'
          }}
        >
          Suivant <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
