import { useState } from "react";
import {
  Activity, CheckCircle, XCircle, AlertCircle, Clock,
  UserCheck, TrendingUp, CornerUpRight, Calendar, AlignLeft, Star
} from "lucide-react";
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* ── Toggle button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 flex items-center gap-2 bg-transparent border-none cursor-pointer text-left"
      >
        <Activity size={12} className="text-gray-400 shrink-0" />
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-1">
          {t("components.actuality.title")}
          {actuality.length > 0 && (
            <span style={{ marginLeft: 6, background: "#f1f5f9", color: "#94a3b8", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "1px 7px" }}>
              {actuality.length}
            </span>
          )}
        </h2>
        <span style={{ fontSize: 11, color: "#94a3b8", transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          ▼
        </span>
      </button>

      {/* ── Dropdown content ── */}
      {open && (
        <div className="border-t border-gray-100 p-4 flex flex-col gap-2 max-h-80 overflow-y-auto">
          {actuality.length === 0 ? (
            <p className="text-[11px] text-gray-300 text-center py-4">
              {t("components.actuality.empty")}
            </p>
          ) : (
            actuality.map(item => {
              const meta = ACT_META[item.type] ?? ACT_META.comment;
              const Icon = ICON_MAP[meta.icon] ?? AlignLeft;
              return (
                <div key={item.id} style={{
                  display: "flex", flexDirection: "column", gap: 4,
                  padding: "10px 12px", borderRadius: 10,
                  background: "#faf9f7", border: "1px solid #e8e2d9",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Neutral icon circle — no color per type */}
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={11} color="#64748b" />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t(meta.labelKey)}
                    </span>
                    <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {item.date}
                    </span>
                  </div>
                  {(item.message || item.messageKey) && (
                    <p style={{ fontSize: 11, color: "#475569", lineHeight: 1.4, margin: 0, paddingLeft: 26 }}
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