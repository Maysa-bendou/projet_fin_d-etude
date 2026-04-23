import { useState } from "react";

export default function DepartmentModal({ department, setDepartment, setDepartments, departments }) {
  const isEdit = department.id !== undefined;
  const [name, setName] = useState(department.name || "");
  const [description, setDescription] = useState(department.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Non connecté. Veuillez vous reconnecter.");
      return;
    }

    if (!name.trim()) {
      alert("Le nom est obligatoire !");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = isEdit
        ? `http://localhost:3001/api/departments/${department.id}`
        : "http://localhost:3001/api/departments";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (isEdit) {
        setDepartments(departments.map(d => d.id === data.id ? data : d));
      } else {
        setDepartments([data, ...departments]);
      }

      setDepartment(null);
    } catch (err) {
      console.error("Department error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Confirmer la suppression ?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Non connecté.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/departments/${department.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDepartments(departments.filter(d => d.id !== department.id));
      setDepartment(null);
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 style inputs cohérent avec UserModal
  const inputStyle = "w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all disabled:bg-gray-100/50";

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      
      {/* MODAL */}
      <div className="bg-[#fefdfd] border border-gray-300 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-200 bg-white/50">
          <h2 className="text-xl font-bold text-slate-800">
            {isEdit ? "Modifier Département" : "Nouveau Département"}
          </h2>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nom du département *
            </label>
            <input
              type="text"
              className={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows="4"
              className={inputStyle}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-white/30 border-t border-gray-200 flex justify-end gap-3">

          {/* Annuler */}
          <button
            onClick={() => setDepartment(null)}
            className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700"
            disabled={loading}
          >
            Annuler
          </button>

          {/* Supprimer */}
          {isEdit && (
            <button
              onClick={handleDelete}
              className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
              disabled={loading}
            >
              Supprimer
            </button>
          )}

          {/* Ajouter / Modifier */}
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-[#e53935] text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#d32f2f] shadow-md transition-all active:scale-95"
            disabled={loading || !name.trim()}
          >
            {loading ? "..." : isEdit ? "Modifier" : "Créer"}
          </button>

        </div>
      </div>
    </div>
  );
}