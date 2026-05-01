import { Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";

// ── Couleurs des bulles ──────────────────────────────────────────────
const COLORS = {
  employee:   { bg: "#fce7f3", color: "#9d174d", border: "#fecaca" },  // rose/rouge
  technician: { bg: "#eff6ff", color: "#1d4ed8",  border: "#bfdbfe" },   // bleu
  techInfo:   { bg: "#fffbeb", color: "#92400e",  border: "#fde68a" },   // amber (mode "info/commentaire")
  confirm:    { bg: "#f0fdf4", color: "#15803d",  border: "#bbf7d0" },   // vert
};

function FileList({ files, isMine }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2.5">
      {files.map(function(f, i) {
        var url = "http://localhost:3001/" + f.filePath;
        var cls = isMine
          ? "flex items-center gap-1.5 text-[10px] font-medium rounded-full px-2.5 py-1 bg-white/20 text-white/90 hover:bg-white/30 transition-colors"
          : "flex items-center gap-1.5 text-[10px] font-medium rounded-full px-2.5 py-1 bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors";
        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={cls}>
            <Paperclip size={9} strokeWidth={2.5} />
            {f.fileName}
          </a>
        );
      })}
    </div>
  );
}

export default function ConvBubble({ item, currentUser, empInitials, empName }) {
  const { t } = useTranslation("technicien");
  var isMine   = item.authorId === currentUser?.id;
  var isSystem = item.type === "status";

  // ── System message ─────────────────────────────────────────────────
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span
          className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200/80 rounded-full px-4 py-1.5 tracking-wide"
          dangerouslySetInnerHTML={{ __html: item.message }}
        />
      </div>
    );
  }

  // ── Confirmation bubble ────────────────────────────────────────────
  if (item.type === "confirm") {
    return (
      <div className="flex flex-col items-end mb-5">
        <div className="flex items-end gap-2.5 flex-row-reverse">
          <div className="w-8 h-8 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white"
            style={{ background: "#1d4ed8" }}>
            {(currentUser?.name?.[0] ?? "T") + (currentUser?.surname?.[0] ?? "")}
          </div>
          <div className="max-w-[78%]">
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full mb-2 inline-block tracking-wide"
              style={{ background: COLORS.confirm.bg, color: COLORS.confirm.color, border: `1px solid ${COLORS.confirm.border}` }}>
              {t("conv.tags.confirm")}
            </span>
            <div className="rounded-2xl rounded-tr-sm px-4 py-3.5 shadow-sm"
              style={{ background: COLORS.confirm.bg, border: `1px solid ${COLORS.confirm.border}` }}>
              <p className="text-[12px] mb-3 font-medium" style={{ color: COLORS.confirm.color }}>
                {t("conv.confirmQuestion")}
              </p>
              <div className="flex gap-2">
                <span className="flex-1 text-center text-[11px] font-semibold rounded-xl py-1.5 bg-white cursor-default"
                  style={{ border: `1px solid ${COLORS.confirm.border}`, color: COLORS.confirm.color }}>
                  {t("conv.confirmYes")}
                </span>
                <span className="flex-1 text-center text-[11px] font-semibold rounded-xl py-1.5 bg-white cursor-default"
                  style={{ border: "1px solid #fecaca", color: "#dc2626" }}>
                  {t("conv.confirmNo")}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 mr-10">{t("conv.youLabel")} · {item.date}</p>
      </div>
    );
  }

  // ── Choisir la palette selon l'auteur et le type ───────────────────
  var palette;
  if (isMine) {
    palette = COLORS.technician;
  } else {
    palette = COLORS.employee;
  }

  // ── Type tags ─────────────────────────────────────────────────────
  var tags = {
    solution:         { label: t("conv.tags.solution"),         bg: COLORS.technician.bg, color: COLORS.technician.color, border: COLORS.technician.border },
    info:             { label: t("conv.tags.info"),             bg: COLORS.technician.bg, color: COLORS.technician.color, border: COLORS.technician.border },
    redirect:         { label: t("conv.tags.redirect"),         bg: "#fdf4ff",            color: "#7e22ce",               border: "#e9d5ff"                 },
    confirm:          { label: t("conv.tags.confirm"),          bg: COLORS.confirm.bg,    color: COLORS.confirm.color,    border: COLORS.confirm.border    },
    emp_reply:        { label: t("conv.tags.emp_reply"),        bg: COLORS.employee.bg,   color: COLORS.employee.color,   border: COLORS.employee.border   },
    confirmed:        { label: t("conv.tags.confirmed"),        bg: COLORS.confirm.bg,    color: COLORS.confirm.color,    border: COLORS.confirm.border    },
    rejected_confirm: { label: t("conv.tags.rejected_confirm"), bg: "#fef2f2",            color: "#dc2626",               border: "#fecaca"                 },
  };
  var typeTag = tags[item.type];

  return (
    <div className={"flex flex-col mb-5 " + (isMine ? "items-end" : "items-start")}>
      <div className={"flex items-end gap-2.5 " + (isMine ? "flex-row-reverse" : "flex-row")}>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white"
          style={{
            background: isMine ? COLORS.technician.bg : COLORS.employee.bg,
            color:      isMine ? COLORS.technician.color : COLORS.employee.color,
            border:     isMine ? `1px solid ${COLORS.technician.border}` : `1px solid ${COLORS.employee.border}`,
          }}
        >
          {isMine
            ? (currentUser?.name?.[0] ?? "T") + (currentUser?.surname?.[0] ?? "")
            : empInitials}
        </div>

        <div className={"max-w-[75%] flex flex-col " + (isMine ? "items-end" : "items-start")}>

          {/* Type tag */}
          {typeTag && (
            <span
              className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full mb-1.5 tracking-wide"
              style={{ background: typeTag.bg, color: typeTag.color, border: `1px solid ${typeTag.border}` }}
            >
              {typeTag.label}
            </span>
          )}

          {/* Bubble */}
          <div
            className={"rounded-2xl px-4 py-3 text-[12.5px] leading-relaxed " + (isMine ? "rounded-tr-sm" : "rounded-tl-sm")}
            style={{
              background: palette.bg,
              color:      palette.color,
              border:     `1px solid ${palette.border}`,
              boxShadow:  "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: item.message }} />
            <FileList files={item.files} isMine={isMine} />
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <p className={"text-[10px] text-slate-400 mt-1.5 " + (isMine ? "mr-10" : "ml-10")}>
        {isMine ? t("conv.youLabel") : empName} · {item.date}
      </p>
    </div>
  );
}