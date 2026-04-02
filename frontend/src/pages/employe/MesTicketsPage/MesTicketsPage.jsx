import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function MesTicketsPage() {
  const navigate = useNavigate();
  const [ticketsData, setTicketsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- États pour les options dynamiques (DB) ---
  const [dbEnums, setDbEnums] = useState({ statuts: [], priorites: [], categories: [] });
  const [dbServices, setDbServices] = useState([]);

  // ✅ FIX: added missing category
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const statusStyle = {
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-purple-100 text-purple-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-gray-200 text-gray-700",
    rejected: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
    pending_supplier: "bg-orange-100 text-orange-700",
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) {
        navigate("/login");
        return;
      }

      const enumRes = await fetch("http://localhost:3001/api/tech/enums");
      const enumData = await enumRes.json();
      setDbEnums(enumData);

      const serviceRes = await fetch("http://localhost:3001/api/tech/services");
      const servicesData = await serviceRes.json();
      setDbServices(servicesData);

      const res = await fetch(`http://localhost:3001/api/tickets/my/${user.id}`);
      if (!res.ok) throw new Error("Erreur lors de la récupération des tickets");
      const data = await res.json();
      setTicketsData(data);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  // ✅ FIX: include category + keep same logic
  const filteredTickets = useMemo(() => {
    return ticketsData.filter((t) => {
      const matchesStatus = !filterStatus || t.status === filterStatus;
      const matchesPriority = !filterPriority || t.priority === filterPriority;
      const matchesService = !filterService || t.service === filterService;
      const matchesCategory = !filterCategory || t.category === filterCategory;

      return matchesStatus && matchesPriority && matchesService && matchesCategory;
    });
  }, [ticketsData, filterStatus, filterPriority, filterService, filterCategory]);

  if (loading) return <p className="p-6">Chargement des tickets...</p>;
  if (error) return <p className="p-6 text-red-500">Erreur: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Suivez et gérez vos tickets</h1>

      {/* ✅ FILTRES (design intact) */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">

        {/* STATUT */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Statut</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {/* ✅ FIX: value="" */}
            <option value="">Tous les statuts</option>
            {dbEnums.statuts?.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* CATÉGORIE */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Catégorie</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {/* ✅ FIX */}
            <option value="">Toutes les catégories</option>
            {dbEnums.categories?.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* ✅ NEW: PRIORITÉ (uses your existing dbEnums) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Priorité</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Toutes les priorités</option>
            {dbEnums.priorites?.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* SERVICE */}
        <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Service</label>
        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Tous les services</option>
          {dbServices.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
        </div>

        {/* RESET */}
        <button
          className="text-red-500 border px-4 py-2 rounded-lg hover:bg-red-50"
          onClick={() => {
            setFilterStatus("");
            setFilterPriority("");
            setFilterService("");
            setFilterCategory(""); // ✅ FIX
          }}
        >
          Réinitialiser
        </button>
      </div>

      {/* TABLE (UNCHANGED) */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        {filteredTickets.length === 0 ? (
          <p className="p-6 text-center text-gray-500">Aucun ticket trouvé.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr className="text-left">
                <th className="p-3">ID</th>
                <th className="p-3">TITRE</th>
                <th className="p-3">SERVICE</th>
                <th className="p-3">ASSIGNÉ À</th>
                <th className="p-3">PRIORITÉ</th>
                <th className="p-3">STATUT</th>
                <th className="p-3">DATE CRÉATION</th>
                <th className="p-3">DERNIÈRE MAJ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/employee/ticket/${t.id}`)}
                  className="border-t hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="p-3 font-medium">{t.id}</td>
                  <td className="p-3">{t.title}</td>
                  <td className="p-3 text-gray-600">{t.service || "N/A"}</td>
                  <td className="p-3 text-gray-600">{t.technicien || "Non assigné"}</td>
                  <td className="p-3">
                    <span className="capitalize">{t.priority || "N/A"}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle[t.status] || "bg-gray-100"}`}>
                      {t.status === "open" ? "Ouvert" :
                       t.status === "in_progress" ? "En cours" :
                       t.status === "resolved" ? "Résolu" :
                       t.status === "closed" ? "Fermé" : t.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{t.dateCreation}</td>
                  <td className="p-3 text-gray-500">{t.maj}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}