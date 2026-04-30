import { useTranslation } from "react-i18next";
import { MdArrowBack } from "react-icons/md";

export default function Header({ ticket, allIds, idx, prevId, nextId, goToTicket, navigate }) {
  const { t } = useTranslation("technicien");

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
      <button
        onClick={() => navigate("/technician/tickets-assignes")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: 0 }}
      >
        <MdArrowBack style={{ fontSize: 16 }} /> {t("components.header.assignedTickets")}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => prevId && goToTicket(prevId)}
          disabled={!prevId}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "1px solid #d9d4cc", background: "#fff", cursor: !prevId ? "not-allowed" : "pointer", color: !prevId ? "#c4bdb3" : "#374151", fontSize: 12, fontWeight: 700 }}
        >
          <MdArrowBack style={{ fontSize: 14 }} /> {t("components.header.previous")}
        </button>
        {idx >= 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", padding: "0 4px" }}>
            #{ticket.id}
          </span>
        )}
        <button
          onClick={() => nextId && goToTicket(nextId)}
          disabled={!nextId}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "1px solid #d9d4cc", background: "#fff", cursor: !nextId ? "not-allowed" : "pointer", color: !nextId ? "#c4bdb3" : "#374151", fontSize: 12, fontWeight: 700 }}
        >
          {t("components.header.next")} <MdArrowBack style={{ fontSize: 14, transform: "rotate(180deg)" }} />
        </button>
      </div>
    </div>
  );
}