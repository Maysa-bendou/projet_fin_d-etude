import { useState, useRef } from "react";
import { Lock, Paperclip, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ManualCloseModal({ onConfirm, onCancel, loading }) {
  const { t } = useTranslation("technicien");

  const [solution, setSolution] = useState("");
  const [note,     setNote]     = useState("");
  const [files,    setFiles]    = useState([]);
  const fileInputRef = useRef(null);

  // ── logic unchanged ───────────────────────────────────────────────────────
  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Lock size={20} className="text-gray-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{t("manualClose.title")}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {t("manualClose.subtitle")}
            </p>
          </div>
        </div>

        {/* Solution — required */}
        <div>
          <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">
            {t("manualClose.solutionLabel")} <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4}
            value={solution}
            onChange={e => setSolution(e.target.value)}
            placeholder={t("manualClose.solutionPlaceholder")}
            className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 resize-none focus:outline-none focus:border-blue-400 leading-relaxed"
          />
        </div>

        {/* Note — optional */}
        <div>
          <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">
            {t("manualClose.noteLabel")}{" "}
            <span className="text-gray-400 font-normal">({t("manualClose.optional")})</span>
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={t("manualClose.notePlaceholder")}
            className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 resize-none focus:outline-none focus:border-gray-400 leading-relaxed"
          />
        </div>

        {/* Attachments — optional */}
        <div>
          <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">
            {t("manualClose.attachmentsLabel")}
          </label>

          {files.length > 0 && (
            <div className="flex flex-col gap-1 mb-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip size={11} className="text-gray-400 shrink-0" />
                    <span className="text-[11px] text-gray-700 truncate">{f.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      ({(f.size / 1024).toFixed(0)} Ko)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-gray-400 hover:text-red-500 transition shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-[11px] font-medium text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-2 w-full hover:border-gray-400 hover:bg-gray-50 transition"
          >
            <Paperclip size={12} />
            {t("manualClose.attachBtn")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-[12px] font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 bg-transparent cursor-pointer transition"
          >
            {t("manualClose.cancel")}
          </button>
          <button
            onClick={() => onConfirm(note, files, solution)}
            disabled={loading || !solution.trim()}
            className="px-4 py-2 text-[12px] font-semibold rounded-lg bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50 cursor-pointer transition flex items-center gap-2"
          >
            <Lock size={13} />
            {loading ? t("manualClose.closing") : t("manualClose.confirm")}
          </button>
        </div>

      </div>
    </div>
  );
}
