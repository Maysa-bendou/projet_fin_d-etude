import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MesTicketsPage() {
  const navigate = useNavigate();
  const [ticketsData, setTicketsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterService, setFilterService] = useState("");

  // Liste des services (à synchroniser avec ta base si possible)
  const services = [
    "IT Support", "Software", "Hardware", "Access", "Account",
    "Service Desk", "Password", "IT Network", "Network",
    "IT Collaboration Systems", "Messaging", "IT Security", "VPN", "Security"
  ];

  const statusOptions = ["open", "in_progress", "pending", "pending_supplier", "resolved", "closed", "rejected"];
  const priorityOptions = ["low", "medium", "high", "critical"];

  const statusStyle = {
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-purple-100 text-purple-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-gray-200 text-gray-700",
    rejected: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
    pending_supplier: "bg-orange-100 text-orange-700",
  };

  useEffect(() => {
    async function fetchTickets() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) {
          navigate("/login");
          return;
        }

        const res = await fetch(`http://localhost:3001/api/tickets/my/${user.id}`);

        if (!res.ok) throw new Error("Erreur lors de la récupération des tickets");

        const data = await res.json();

        // On garde les données telles que renvoyées par le backend (pas de mapping lourd)
        setTicketsData(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, [navigate]);

  // Filtrage côté frontend
  const filteredTickets = ticketsData
    .filter((t) => {
      if (!searchText) return true;
      const search = searchText.toLowerCase();
      return (
        t.id?.toString().includes(search) ||
        t.title?.toLowerCase().includes(search) ||
        (t.dateCreation && t.dateCreation.includes(search))
      );
    })
    .filter((t) => (filterStatus ? t.status === filterStatus : true))
    .filter((t) => (filterPriority ? t.priority === filterPriority : true))
    .filter((t) => (filterService ? t.service === filterService : true));

  if (loading) return <p className="p-6">Chargement des tickets...</p>;
  if (error) return <p className="p-6 text-red-500">Erreur: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Suivez et gérez vos tickets</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <input
          type="text"
          placeholder="Rechercher par ID, titre ou date..."
          className="border rounded-lg px-3 py-2 w-80"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <select
          className="border rounded-lg px-3 py-2"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s === "open" ? "Ouvert" :
               s === "in_progress" ? "En cours" :
               s === "resolved" ? "Résolu" :
               s === "closed" ? "Fermé" : s}
            </option>
          ))}
        </select>

        <select
          className="border rounded-lg px-3 py-2"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="">Toutes les priorités</option>
          {priorityOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          className="border rounded-lg px-3 py-2"
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
        >
          <option value="">Tous les services</option>
          {services.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button
          className="text-red-500 border px-4 py-2 rounded-lg hover:bg-red-50"
          onClick={() => {
            setSearchText("");
            setFilterStatus("");
            setFilterPriority("");
            setFilterService("");
          }}
        >
          Réinitialiser
        </button>
      </div>

      {/* Tableau */}
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