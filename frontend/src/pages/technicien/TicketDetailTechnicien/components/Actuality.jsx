import { useState } from "react";
import {
  Activity, CheckCircle, XCircle, AlertCircle, Clock,
  UserCheck, TrendingUp, CornerUpRight, Calendar, AlignLeft, Star
} from "lucide-react";
import { HiOutlineChevronDown, HiOutlineChevronUp } from "react-icons/hi2";
import { useTranslation } from "react-i18next";
import { ACT_META } from "./constants";

const ICON_MAP = {
  "user-check":      UserCheck,
  "clock":           Clock,
  "alert-circle":    AlertCircle,
  "check-circle":    CheckCircle,
  "x-circle":        XCircle,
  "trending-up":     TrendingUp,
  "corner-up-right": CornerUpRight,
  "calendar":        Calendar,
  "align-left":      AlignLeft,
  "star":            Star,
};

export default function Actuality({ actuality }) {
  const { t } = useTranslation("technicien");
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>

      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "14px 18px", background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <Activity size={14} color="#94a3b8" />
        <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, flex: 1, textAlign: "left" }}>
          {t("components.actuality.title")}
          {actuality.length > 0 && (
            <span style={{ marginLeft: 6, background: "#f1f5f9", color: "#64748b", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "1px 7px" }}>
              {actuality.length}
            </span>
          )}
        </p>
        {open ? <HiOutlineChevronUp size={14} color="#94a3b8" /> : <HiOutlineChevronDown size={14} color="#94a3b8" />}
      </button>

      {open && (
        <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6, maxHeight: 480, overflowY: "auto" }}>
          {actuality.length === 0 ? (
            <p style={{ fontSize: 12, color: "#d1d5db", textAlign: "center", marginTop: 12 }}>
              {t("components.actuality.empty")}
            </p>
          ) : (
            actuality.map(item => {
              const meta = ACT_META[item.type] ?? ACT_META.comment;
              const Icon = ICON_MAP[meta.icon] ?? AlignLeft;
              return (
                <div key={item.id} style={{
                  padding: "10px 12px", borderRadius: 10,
                  background: "#fff", border: "1px solid #f1f5f9",
                  display: "flex", flexDirection: "column", gap: 4,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon size={13} color={meta.dot ?? "#64748b"} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t(meta.labelKey)}
                    </span>
                    <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {item.date}
                    </span>
                  </div>
                  {(item.message || item.messageKey) && (
                    <p style={{ fontSize: 11, color: "#475569", lineHeight: 1.4, margin: 0, paddingLeft: 19 }}
                      dangerouslySetInnerHTML={{ __html: item.messageKey ? t(item.messageKey) : item.message }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
