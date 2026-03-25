import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const TicketsServicePage = () => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ✅ Fetch from backend
  useEffect(() => {
    fetch("http://localhost:3001/api/tickets")
      .then(res => res.json())
      .then(data => {
        console.log("✅ DATA FROM BACKEND:", data);
        setTickets(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // ✅ Filter
  const filteredTickets = useMemo(() => {
    return tickets.filter(t =>
      (t.title || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [tickets, search]);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 bg-slate-100 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tickets Service</h1>

        <input
          type="text"
          placeholder="Search..."
          className="px-3 py-2 border rounded-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3">Titre</th>
              <th className="p-3">Description</th>
              <th className="p-3">Priorité</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Employé</th>
              <th className="p-3">Technicien</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredTickets.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50">

                <td className="p-3 font-medium">
                  {t.title || "N/A"}
                </td>

                <td className="p-3">
                  {t.description || "N/A"}
                </td>

                <td className="p-3">
                  {t.priority || "N/A"}
                </td>

                <td className="p-3">
                  {t.status || "N/A"}
                </td>

                <td className="p-3">
                  {t.createdBy || "N/A"}
                </td>

                <td className="p-3">
                  {t.assignedTo || "Non assigné"}
                </td>

                <td className="p-3">
                  <button
                    onClick={() => navigate(`/technician/tickets-service/${t.id}`)}
                    className="text-blue-600 text-xs"
                  >
                    Voir →
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

        {filteredTickets.length === 0 && (
          <p className="text-center p-6 text-gray-400">
            Aucun ticket trouvé
          </p>
        )}
      </div>

    </div>
  );
};

export default TicketsServicePage;