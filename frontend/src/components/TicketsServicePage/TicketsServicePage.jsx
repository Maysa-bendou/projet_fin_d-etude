import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const TicketsServicePage = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role || "";

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ✅ Fetch tickets
  useEffect(() => {
    fetch("http://localhost:3001/api/tickets")
      .then(res => res.json())
      .then(data => {
        setTickets(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  // ✅ Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t =>
      (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [tickets, search]);

  // ✅ Technician takes ticket
  const handleTakeTicket = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicienId: user.id })
      });

      if (!res.ok) throw new Error("Assign failed");

      // update UI instantly
      setTickets(prev =>
        prev.map(t =>
          t.id === id ? { ...t, assignedTo: user.name } : t
        )
      );

    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Dynamic navigation (VERY IMPORTANT)
  const handleView = (id) => {
    navigate(`/${role}/tickets-service/${id}`);
  };

  // ✅ Priority styles
  const priorityStyle = {
    Critique: "bg-red-100 text-red-700",
    Haute: "bg-orange-100 text-orange-700",
    Moyenne: "bg-blue-100 text-blue-700",
    Basse: "bg-gray-100 text-gray-600"
  };

  // ✅ Status styles
  const statusStyle = {
    Ouvert: "bg-blue-100 text-blue-700",
    "En cours": "bg-yellow-100 text-yellow-700",
    "En attente": "bg-purple-100 text-purple-700",
    Résolu: "bg-green-100 text-green-700",
    Fermé: "bg-gray-200 text-gray-700"
  };

  if (loading) {
    return <p className="p-6 text-gray-500">Loading tickets...</p>;
  }

  return (
    <div className="p-6 bg-slate-100 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {role === "manager"
            ? "Gestion des tickets"
            : "Tickets du service"}
        </h1>

        <input
          type="text"
          placeholder="Search by title or description..."
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
              <th className="p-3 text-left">Titre</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3">Priorité</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Employé</th>
              <th className="p-3">Technicien</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredTickets.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50 transition">

                {/* Title */}
                <td className="p-3 font-medium text-gray-800">
                  {t.title || "N/A"}
                </td>

                {/* Description */}
                <td className="p-3 text-gray-600">
                  {t.description || "N/A"}
                </td>

                {/* Priority */}
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${priorityStyle[t.priority] || "bg-gray-100"}`}>
                    {t.priority || "N/A"}
                  </span>
                </td>

                {/* Status */}
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyle[t.status] || "bg-gray-100"}`}>
                    {t.status || "N/A"}
                  </span>
                </td>

                {/* Employee */}
                <td className="p-3 text-center">
                  {t.createdBy || "N/A"}
                </td>

                {/* Technician */}
                <td className="p-3 text-center">
                  {t.assignedTo || (
                    <span className="text-gray-400">Non assigné</span>
                  )}
                </td>

                {/* Actions */}
                <td className="p-3 flex gap-3 justify-center">

                  {/* View */}
<button
  onClick={() => handleView(t.id)}
  className="text-blue-600 hover:underline"
>
  Voir
</button>



                </td>

              </tr>
            ))}
          </tbody>

        </table>

        {/* Empty state */}
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