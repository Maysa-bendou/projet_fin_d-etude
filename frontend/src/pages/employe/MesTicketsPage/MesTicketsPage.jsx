import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MesTicketsPage() {
  const navigate = useNavigate();
  const [ticketsData, setTicketsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const services = [
    "IT Support",
    "Software",
    "Hardware",
    "Access",
    "Account",
    "Service Desk",
    "Password",
    "IT Network",
    "Network",
    "IT Collaboration Systems",
    "Messaging",
    "IT Security",
    "VPN",
    "Security",
  ];

  const statusStyle = {
    Ouvert: "bg-blue-100 text-blue-700",
    "En cours": "bg-purple-100 text-purple-700",
    Résolu: "bg-green-100 text-green-700",
    Fermé: "bg-gray-200 text-gray-700",
    Rejeté: "bg-red-100 text-red-700",
  };

  const [filterStatus, setFilterStatus] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    async function fetchTickets() {
      try {
        // Get the logged-in user from localStorage
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
          navigate("/login");
          return;
        }

        const res = await fetch(`http://localhost:3001/api/tickets/my/${user.id}`);
        if (!res.ok) throw new Error("Erreur lors de la récupération des tickets");
        const data = await res.json();

        const mapped = data.map((t) => ({
          rawId: t.id,
          titre: t.title,
          service: t.service_id ? services[t.service_id - 1] : "N/A",
          technicien: t.technicien_name || "Non assigné",
          status:
            t.status === "open"
              ? "Ouvert"
              : t.status === "in_progress"
              ? "En cours"
              : t.status === "resolved"
              ? "Résolu"
              : t.status === "closed"
              ? "Fermé"
              : t.status === "rejected"
              ? "Rejeté"
              : t.status,
          dateCreation: t.created_at.split("T")[0],
          maj: t.updated_at.split("T")[0] + " " + t.updated_at.split("T")[1].slice(0, 5),
          urgence: t.urgency || "N/A",
          priorite: t.priority,
          impact: t.impact,
          category: t.category,
        }));

        setTicketsData(mapped);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, []);

  const filteredTickets = ticketsData
    .filter((t) => (filterStatus ? t.status === filterStatus : true))
    .filter((t) => (filterService ? t.service === filterService : true))
    .filter((t) => (filterDate ? t.dateCreation === filterDate : true))
    .filter((t) =>
      searchText ? t.titre.toLowerCase().includes(searchText.toLowerCase()) : true
    );

  if (loading) return <p className="p-6">Chargement des tickets...</p>;
  if (error) return <p className="p-6 text-red-500">Erreur: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Suivez et gérez vos tickets</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <input
          type="text"
          placeholder="Recherche par titre..."
          className="border rounded-lg px-3 py-2 w-72"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {Object.keys(statusStyle).map((s) => (
            <option key={s} value={s}>{s}</option>
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
        <input
          type="date"
          className="border rounded-lg px-3 py-2"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <button
          className="text-red-500 border px-3 py-2 rounded-lg"
          onClick={() => {
            setFilterStatus("");
            setFilterService("");
            setFilterDate("");
            setSearchText("");
          }}
        >
          Réinitialiser
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        {filteredTickets.length === 0 ? (
          <p className="p-6 text-center text-gray-500">Aucun ticket trouvé.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr className="text-left">
                <th className="p-3">TITRE</th>
                <th className="p-3">SERVICE</th>
                <th className="p-3">TECHNICIEN</th>
                <th className="p-3">STATUT</th>
                <th className="p-3">DATE CRÉATION</th>
                <th className="p-3">DERNIÈRE MAJ</th>
                <th className="p-3">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50 transition">
                  <td className="p-3">{t.titre}</td>
                  <td className="p-3 text-gray-600">{t.service}</td>
                  <td className="p-3 text-gray-600">{t.technicien}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle[t.status]}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{t.dateCreation}</td>
                  <td className="p-3 text-gray-500">{t.maj}</td>
                  <td className="p-3">
                    <button
                      onClick={() => navigate(`/employee/ticket/${t.rawId}`)}
                      className="text-blue-500 hover:underline"
                    >
                      Voir détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}