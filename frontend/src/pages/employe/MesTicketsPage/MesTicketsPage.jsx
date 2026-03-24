import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MesTicketsPage() {
  const navigate = useNavigate(); 
  const services = [
    "IT Support",
    "Software",
    "Hardware",
    "Access",
    "Account",
    "Service Desk",
    "Password",
    "IT Network",
    "Network",+
    "IT Collaboration Systems",
    "Messaging",
    "IT Security",
    "VPN",
    "Security",
  ];

  const ticketsData = [
    {
      id: "IM000007",
      titre: "File d'attente SM9 vide côté utilisateur",
      service: "IT Support",
      technicien: "Ahmed Benali",
      status: "Rejeté",
      dateCreation: "2026-03-15",
      maj: "2026-03-15 10:23",
    },
    {
      id: "IM000006",
      titre: "Installation de Visio et Project",
      service: "Software",
      technicien: "Sara Haddad",
      status: "Fermé",
      dateCreation: "2026-03-14",
      maj: "2026-03-14 16:50",
    },
    {
      id: "IM000005",
      titre: "Imprimante réseau introuvable – 3e étage",
      service: "Hardware",
      technicien: "Karim Bensaid",
      status: "Résolu",
      dateCreation: "2026-03-13",
      maj: "2026-03-13 14:10",
    },
    {
      id: "IM000002",
      titre: "Coupures VPN récurrentes",
      service: "VPN",
      technicien: "Nadia Khelifi",
      status: "En cours",
      dateCreation: "2026-03-12",
      maj: "2026-03-12 09:00",
    },
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

  const filteredTickets = ticketsData.filter((t) => {
    return (
      (filterStatus === "" || t.status === filterStatus) &&
      (filterService === "" || t.service === filterService) &&
      (filterDate === "" || t.dateCreation === filterDate)
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Suivez et gérez vos tickets
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <input
          type="text"
          placeholder="Recherche par ID ou titre..."
          className="border rounded-lg px-3 py-2 w-72"
          onChange={(e) =>
            setFilterStatus(e.target.value) // optional: implement search by ID/title later
          }
        />

        <select
          className="border rounded-lg px-3 py-2"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {Object.keys(statusStyle).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="border rounded-lg px-3 py-2"
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
        >
          <option value="">Tous les services</option>
          {services.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
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
          }}
        >
          Réinitialiser
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="text-left">
              <th className="p-3">ID</th>
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
            {filteredTickets.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50 transition">
                <td className="p-3 font-medium">{t.id}</td>
                <td className="p-3">{t.titre}</td>
                <td className="p-3 text-gray-600">{t.service}</td>
                <td className="p-3 text-gray-600">{t.technicien}</td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusStyle[t.status]
                    }`}
                  >
                    {t.status}
                  </span>
                </td>

                <td className="p-3 text-gray-500">{t.dateCreation}</td>
                <td className="p-3 text-gray-500">{t.maj}</td>

                <td className="p-3">
                  <button
                    onClick={() => navigate(`/employee/ticket/${t.id}`)}
                    className="text-blue-500 hover:underline"
                  >
                     Voir détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
   
  );
 
}