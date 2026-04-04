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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {isEdit ? "Modifier Département" : "Nouveau Département"}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du département *
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows="4"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t">
          <button
            className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            onClick={() => setDepartment(null)}
            disabled={loading}
          >
            Annuler
          </button>
          {isEdit && (
            <button
              className="flex-1 bg-red-100 text-red-700 font-medium py-3 px-4 rounded-lg hover:bg-red-200 transition-colors"
              onClick={handleDelete}
              disabled={loading}
            >
              Supprimer
            </button>
          )}
          <button
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
          >
            {loading ? "..." : isEdit ? "Modifier" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

