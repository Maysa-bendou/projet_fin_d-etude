import { Paperclip } from "lucide-react";

function FileList({ files, isMine }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {files.map(function(f, i) {
      var url = "http://localhost:3001/" + f.filePath;   var cls = isMine
          ? "flex items-center gap-1 text-[10px] rounded px-2 py-0.5 bg-blue-500 text-blue-100"
          : "flex items-center gap-1 text-[10px] rounded px-2 py-0.5 bg-gray-100 text-gray-500";
        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={cls}>
            <Paperclip size={9} />
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
      <div className="flex justify-center my-3">
        <span
          className="text-[11px] text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-4 py-1"
          dangerouslySetInnerHTML={{ __html: item.message }}
        />
      </div>
    );
  }

  if (item.type === "confirm") {
    return (
      <div className="flex flex-col items-end mb-4">
        <div className="flex items-end gap-2 flex-row-reverse">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {(currentUser?.name?.[0] ?? "T") + (currentUser?.surname?.[0] ?? "")}
          </div>
          <div className="max-w-[78%]">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 inline-block bg-green-100 text-green-700">
              Confirmation envoyée
            </span>
            <div className="bg-green-50 border border-green-200 rounded-2xl rounded-tr-sm px-4 py-3">
              <p className="text-[12px] text-gray-700 mb-2">Le problème est-il résolu ?</p>
              <div className="flex gap-2">
                <span className="flex-1 text-center text-[11px] font-medium border border-green-300 text-green-700 rounded-lg py-1 bg-white">
                  Oui, résolu
                </span>
                <span className="flex-1 text-center text-[11px] font-medium border border-red-200 text-red-600 rounded-lg py-1 bg-white">
                  Non, toujours un problème
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 mr-9">Vous · {item.date}</p>
      </div>
    );
  }

  var tags = {
    solution:         { label: "Solution",             cls: "bg-blue-100 text-blue-700"   },
    info:             { label: "Commentaire",        cls: "bg-amber-100 text-amber-700" },
    redirect:         { label: "Redirigé",             cls: "bg-pink-100 text-pink-700"   },
    confirm:          { label: "Confirmation envoyée", cls: "bg-green-100 text-green-700" },
    emp_reply:        { label: "Réponse employé",      cls: "bg-gray-100 text-gray-600"   },
    confirmed:        { label: "Résolution confirmée", cls: "bg-green-100 text-green-700" },
    rejected_confirm: { label: "Solution refusée",     cls: "bg-red-100 text-red-700"     },
  };
  var typeTag = tags[item.type];

  var bubbleCls = isMine
    ? item.type === "info"
      ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tr-sm"
      : "bg-blue-600 text-white rounded-tr-sm"
    : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm";

  return (
    <div className={"flex flex-col mb-4 " + (isMine ? "items-end" : "items-start")}>
      <div className={"flex items-end gap-2 " + (isMine ? "flex-row-reverse" : "flex-row")}>
        <div className={"w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 " + (isMine ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600")}>
          {isMine
            ? (currentUser?.name?.[0] ?? "T") + (currentUser?.surname?.[0] ?? "")
            : empInitials}
        </div>
        <div className={"max-w-[75%] flex flex-col " + (isMine ? "items-end" : "items-start")}>
          {typeTag && (
            <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 " + typeTag.cls}>
              {typeTag.label}
            </span>
          )}
          <div className={"rounded-2xl px-4 py-2.5 text-[12px] leading-relaxed shadow-sm " + bubbleCls}>
            <div dangerouslySetInnerHTML={{ __html: item.message }} />
            <FileList files={item.files} isMine={isMine} />
          </div>
        </div>
      </div>
      <p className={"text-[10px] text-gray-400 mt-1 " + (isMine ? "mr-9" : "ml-9")}>
        {isMine ? "Vous" : empName} · {item.date}
      </p>
    </div>
  );
}