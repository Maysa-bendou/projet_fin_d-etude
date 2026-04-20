import { Paperclip } from "lucide-react";

function FileList({ files, isMine }) {
  if (!files || files.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
      {files.map((f, i) => {
        const url = "http://localhost:3001/" + f.filePath;
        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, padding: '3px 8px', borderRadius: 6,
            background: isMine ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
            color: isMine ? '#dbeafe' : '#6b7280',
            textDecoration: 'none', fontFamily: 'Inter, sans-serif'
          }}>
            <Paperclip size={9} />
            {f.fileName}
          </a>
        );
      })}
    </div>
  );
}

const TYPE_BADGE = {
  solution:         { label: "Solution",              bg: "#eff6ff",  color: "#1d4ed8" },
  info:             { label: "Commentaire",           bg: "#fffbeb",  color: "#92400e" },
  redirect:         { label: "Redirigé",              bg: "#fdf4ff",  color: "#7c3aed" },
  confirm:          { label: "Confirmation envoyée",  bg: "#f0fdf4",  color: "#16a34a" },
  emp_reply:        { label: "Réponse employé",       bg: "#f3f4f6",  color: "#374151" },
  confirmed:        { label: "Résolution confirmée",  bg: "#f0fdf4",  color: "#16a34a" },
  rejected_confirm: { label: "Solution refusée",      bg: "#fef2f2",  color: "#dc2626" },
};

export default function ConvBubble({ item, currentUser, empInitials, empName }) {
  const isMine = item.authorId === currentUser?.id;
  const isSystem = item.type === "status";

  /* ── Bandeau système ── */
  if (isSystem) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
        <span style={{
          fontSize: 11, color: '#6b7280',
          background: '#f3f4f6', border: '1px solid #e5e7eb',
          borderRadius: 99, padding: '3px 14px',
          fontFamily: 'Inter, sans-serif'
        }}
          dangerouslySetInnerHTML={{ __html: item.message }}
        />
      </div>
    );
  }

  /* ── Bulle de confirmation ── */
  if (item.type === "confirm") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: 'row-reverse' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3b82f6', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {(currentUser?.name?.[0] ?? "T")}{(currentUser?.surname?.[0] ?? "")}
          </div>
          <div style={{ maxWidth: '78%' }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, display: 'inline-block', marginBottom: 6, background: '#f0fdf4', color: '#16a34a' }}>
              Confirmation envoyée
            </span>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, borderTopRightRadius: 4, padding: '12px 14px' }}>
              <p style={{ fontSize: 12, color: '#374151', margin: '0 0 10px 0', fontFamily: 'Inter, sans-serif' }}>Le problème est-il résolu ?</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 8, padding: '5px 0', background: '#fff' }}>Oui, résolu</span>
                <span style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '5px 0', background: '#fff' }}>Non, toujours un problème</span>
              </div>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, marginRight: 36, fontFamily: 'Inter, sans-serif' }}>Vous · {item.date}</p>
      </div>
    );
  }

  const badge = TYPE_BADGE[item.type];

  /* Couleurs bulle */
  const bubbleBg    = isMine ? (item.type === 'info' ? '#fffbeb' : '#3b82f6') : '#fff';
  const bubbleBorder = isMine ? (item.type === 'info' ? '1px solid #fde68a' : 'none') : '1px solid #e5e7eb';
  const bubbleColor  = isMine ? (item.type === 'info' ? '#92400e' : '#fff') : '#111827';
  const brRadius     = isMine ? '12px 4px 12px 12px' : '4px 12px 12px 12px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: isMine ? 'row-reverse' : 'row' }}>

        {/* Avatar */}
        <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: isMine ? '#3b82f6' : '#f3f4f6', color: isMine ? '#fff' : '#374151' }}>
          {isMine ? `${currentUser?.name?.[0] ?? "T"}${currentUser?.surname?.[0] ?? ""}` : empInitials}
        </div>

        {/* Contenu */}
        <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
          {badge && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 99, marginBottom: 5, background: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
          )}
          <div style={{ background: bubbleBg, border: bubbleBorder, borderRadius: brRadius, padding: '10px 14px', fontSize: 12, lineHeight: 1.6, color: bubbleColor, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div dangerouslySetInnerHTML={{ __html: item.message }} />
            <FileList files={item.files} isMine={isMine} />
          </div>
        </div>
      </div>

      <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, marginLeft: isMine ? 0 : 36, marginRight: isMine ? 36 : 0 }}>
        {isMine ? "Vous" : empName} · {item.date}
      </p>
    </div>
  );
}
