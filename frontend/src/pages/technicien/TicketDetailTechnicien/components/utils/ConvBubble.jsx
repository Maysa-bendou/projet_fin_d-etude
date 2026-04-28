import { Paperclip } from "lucide-react";

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
  var isMine = item.authorId === currentUser?.id;
  var isSystem = item.type === "status";

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

  if (item.type === "confirm") {
    return (
      <div className="flex flex-col items-end mb-5">
        <div className="flex items-end gap-2.5 flex-row-reverse">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white">
            {(currentUser?.name?.[0] ?? "T") + (currentUser?.surname?.[0] ?? "")}
          </div>
          <div className="max-w-[78%]">
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full mb-2 inline-block bg-emerald-100 text-emerald-700 tracking-wide">
              Confirmation envoyée
            </span>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/70 rounded-2xl rounded-tr-sm px-4 py-3.5 shadow-sm">
              <p className="text-[12px] text-slate-700 mb-3 font-medium">Le problème est-il résolu ?</p>
              <div className="flex gap-2">
                <span className="flex-1 text-center text-[11px] font-semibold border border-emerald-300 text-emerald-700 rounded-xl py-1.5 bg-white shadow-xs hover:bg-emerald-50 transition-colors cursor-default">
                  Oui, résolu
                </span>
                <span className="flex-1 text-center text-[11px] font-semibold border border-red-200 text-red-500 rounded-xl py-1.5 bg-white shadow-xs hover:bg-red-50 transition-colors cursor-default">
                  Non, toujours un problème
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 mr-10">Vous · {item.date}</p>
      </div>
    );
  }

  var tags = {
    solution:         { label: "Solution",             cls: "bg-blue-100 text-blue-700"     },
    info:             { label: "Commentaire",           cls: "bg-amber-100 text-amber-700"   },
    redirect:         { label: "Redirigé",              cls: "bg-pink-100 text-pink-700"     },
    confirm:          { label: "Confirmation envoyée",  cls: "bg-emerald-100 text-emerald-700" },
    emp_reply:        { label: "Réponse employé",       cls: "bg-slate-100 text-slate-600"   },
    confirmed:        { label: "Résolution confirmée",  cls: "bg-emerald-100 text-emerald-700" },
    rejected_confirm: { label: "Solution refusée",      cls: "bg-red-100 text-red-600"       },
  };
  var typeTag = tags[item.type];

  // Bubble styling — no logic changed, only visual classes refined
  var bubbleCls = isMine
    ? item.type === "info"
      ? "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 text-amber-900 rounded-tr-sm shadow-sm"
      : "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm shadow-md"
    : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-sm shadow-sm";

  var avatarCls = isMine
    ? "w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white"
    : "w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white";

  return (
    <div className={"flex flex-col mb-5 " + (isMine ? "items-end" : "items-start")}>
      <div className={"flex items-end gap-2.5 " + (isMine ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        <div className={avatarCls}>
          {isMine
            ? (currentUser?.name?.[0] ?? "T") + (currentUser?.surname?.[0] ?? "")
            : empInitials}
        </div>

        <div className={"max-w-[75%] flex flex-col " + (isMine ? "items-end" : "items-start")}>
          {/* Type tag */}
          {typeTag && (
            <span className={"text-[10px] font-semibold px-2.5 py-0.5 rounded-full mb-1.5 tracking-wide " + typeTag.cls}>
              {typeTag.label}
            </span>
          )}

          {/* Bubble */}
          <div className={"rounded-2xl px-4 py-3 text-[12.5px] leading-relaxed " + bubbleCls}>
            <div dangerouslySetInnerHTML={{ __html: item.message }} />
            <FileList files={item.files} isMine={isMine} />
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <p className={"text-[10px] text-slate-400 mt-1.5 " + (isMine ? "mr-10" : "ml-10")}>
        {isMine ? "Vous" : empName} · {item.date}
      </p>
    </div>
  );
}