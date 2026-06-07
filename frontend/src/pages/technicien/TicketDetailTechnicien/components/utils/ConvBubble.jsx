import { Paperclip } from "lucide-react";
import DOMPurify from "dompurify";
import { useTranslation } from "react-i18next";

export default function ConvBubble({ item, currentUser, empInitials, empName }) {
  const { t } = useTranslation("technicien");
  const isMine   = item.authorId === currentUser?.id;
  const isSystem = item.type === "status";
  const isClosingMsg = item.type === "comment" && (
  item.message?.startsWith("ticket_closed_with_note:") ||
  item.message === "ticket_closed"
);

// AFTER
if (isSystem || isClosingMsg || item.type === "redirect") {
  let display = item.message;
  if (item.message.startsWith("ticket_closed_with_note:")) {
    const note = item.message.replace("ticket_closed_with_note:", "");
    display = t("conv.status.closedWithNote", { note });
  } else if (item.message === "ticket_closed") {
    display = t("conv.status.closed");
  } else if (item.message.startsWith("ticket_redirected:")) {
    const [, by, reason] = item.message.split(":");
    display = t("conv.status.redirected", { by, reason });
  } else if (item.message.startsWith("status_changed:")) {
    display = t("conv.status.changed");
  }

  return (
    <div className="flex justify-center my-4">
      <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200/80 rounded-full px-4 py-1.5 tracking-wide">
        {display}
      </span>
    </div>
  );
}
 // AFTER
if (item.type === "confirm") return null;
if (item.type === "attachment") return null;

  

  const isEmployee = ["emp_reply", "confirmed", "rejected_confirm"].includes(item.type);

  const bubbleStyle = isEmployee
    ? { background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#334155", borderBottomLeftRadius: 4 }
    : { background: "#1e3a8a", color: "#fff", borderBottomRightRadius: 4 };

const tags = {
  solution:         { label: t("conv.tags.solution"),         color: "#93c5fd" },
  info:             { label: t("conv.tags.info"),             color: "#93c5fd" },
  redirect:         { label: t("conv.tags.redirect"),         color: "#c4b5fd" },
  emp_reply:        { label: t("conv.tags.emp_reply"),        color: "#94a3b8" },
  confirmed:        { label: t("conv.tags.confirmed"),        color: "#86efac" },
  rejected_confirm: { label: t("conv.tags.rejected_confirm"), color: "#fca5a5" },
};
  const typeTag = tags[item.type];

  return (
    <div style={{ display: "flex", marginBottom: 10, justifyContent: isMine ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>

        {typeTag && (
          <span style={{ fontSize: 10, fontWeight: 700, color: typeTag.color, marginBottom: 4, paddingLeft: 2 }}>
            {typeTag.label}
          </span>
        )}

        <div style={{ padding: "9px 13px", borderRadius: 14, fontSize: 13, lineHeight: 1.55, ...bubbleStyle }}>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.message) }} />

          {item.files?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {item.files.map((f, i) => (
                <a key={i} href={"https://ticket-backend-4uw2.onrender.com/" + f.filePath} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, borderRadius: 6, padding: "2px 8px",
                    background: isEmployee ? "#f1f5f9" : "rgba(255,255,255,0.15)",
                    color: isEmployee ? "#64748b" : "#fff",
                    border: isEmployee ? "1px solid #e2e8f0" : "none",
                    textDecoration: "none", fontWeight: 500 }}>
                  <Paperclip size={10} /> {f.fileName}
                </a>
              ))}
            </div>
          )}
{item.type === "solution" && (
  <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.12)" }}>
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
      <div style={{ width:18, height:18, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <span style={{ fontSize:10 }}>?</span>
      </div>
      <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.75)", margin:0 }}>
        {t("conv.confirmQuestion")}
      </p>
    </div>
    <div style={{ display:"flex", gap:6 }}>
      <span style={{
        flex:1, textAlign:"center", fontSize:11, fontWeight:700,
        borderRadius:8, padding:"8px 0",
        background:"#ffffff", color:"#1e3a8a",
        boxShadow:"0 1px 3px rgba(0,0,0,0.15)",
        cursor:"default", letterSpacing:"0.01em"
      }}>
        ✓ {t("conv.confirmYes")}
      </span>
      <span style={{
        flex:1, textAlign:"center", fontSize:11, fontWeight:600,
        borderRadius:8, padding:"8px 0",
        background:"transparent", color:"rgba(255,255,255,0.6)",
        border:"1px solid rgba(255,255,255,0.18)",
        cursor:"default", letterSpacing:"0.01em"
      }}>
        ✕ {t("conv.confirmNo")}
      </span>
    </div>
  </div>
)}
        </div>

        <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 3, padding: "0 2px" }}>
          {isMine ? t("conv.youLabel") : empName} · {item.date}
        </p>
      </div>
    </div>
  );
}
