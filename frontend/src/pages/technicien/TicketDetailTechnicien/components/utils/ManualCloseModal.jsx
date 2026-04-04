import { Lock } from "lucide-react";

export default function ManualCloseModal({ onConfirm, onCancel, loading }) {
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Lock size={20} className="text-gray-600"/>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Fermer le ticket manuellement</p>
            <p className="text-[12px] text-gray-500 mt-0.5">Utilisez cette option si vous avez résolu le problème par téléphone ou en personne.</p>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Note de fermeture (obligatoire)</label>
          <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Ex : Résolu par téléphone à 11h30 — problème confirmé résolu par l'employé."
            className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 resize-none focus:outline-none focus:border-gray-400 leading-relaxed"/>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 text-[12px] font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 bg-transparent cursor-pointer transition">Annuler</button>
          <button onClick={() => onConfirm(note)} disabled={loading || !note.trim()}
            className="px-4 py-2 text-[12px] font-semibold rounded-lg bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50 cursor-pointer transition flex items-center gap-2">
            <Lock size={13}/>{loading ? "Fermeture..." : "Fermer le ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

