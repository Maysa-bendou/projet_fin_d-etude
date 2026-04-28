import { useRef } from "react";
import { Paperclip, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function FileAttachment({ files, onAdd, onRemove, disabled = false }) {
  const { t } = useTranslation("technicien");
  const ref = useRef(null);
  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <button type="button" onClick={() => ref.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition bg-transparent cursor-pointer">
        <Paperclip size={12}/> {t("fileAttachment.attach")}
      </button>
      <input ref={ref} type="file" multiple className="hidden" onChange={e => onAdd(Array.from(e.target.files))}/>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1 text-[11px] text-gray-700">
              <Paperclip size={10} className="text-gray-400"/>
              <span className="max-w-[120px] truncate">{f.name}</span>
              <button type="button" onClick={() => onRemove(i)} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer">
                <X size={11}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

