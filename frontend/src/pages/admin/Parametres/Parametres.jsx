import { useEffect, useState } from "react";

export default function ParametresAdmin() {
  const [stats, setStats] = useState({});
  const [sla, setSla] = useState([]);

  // ENUMS (from your Prisma)
  const priorities = ["low", "medium", "high", "critical"];
  const statuses = ["open", "in_progress", "pending", "resolved", "closed", "rejected"];
  const impact = ["low", "medium", "high"];
  const urgency = ["low", "medium", "high"];

  // FETCH STATS
  useEffect(() => {
    fetch("http://localhost:3001/api/admin/stats")
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  // FETCH SLA
  useEffect(() => {
    fetch("http://localhost:3001/api/sla")
      .then(res => res.json())
      .then(data => setSla(data))
      .catch(() => setSla([]));
  }, []);

  const updateSla = async (id, value) => {
    await fetch(`http://localhost:3001/api/sla/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration_hours: value })
    });

    setSla(sla.map(s => s.id === id ? { ...s, duration_hours: value } : s));
  };

  return (
    <div className="p-6 space-y-6">

      {/* 🔹 STATS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Utilisateurs</p>
          <h2 className="text-2xl font-bold">{stats.totalUsers || 0}</h2>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Tickets</p>
          <h2 className="text-2xl font-bold">{stats.totalTickets || 0}</h2>
        </div>
      </div>

      {/* 🔹 SLA */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-3">Configuration SLA</h2>

        <table className="w-full">
          <thead>
            <tr>
              <th>Priorité</th>
              <th>Heures</th>
            </tr>
          </thead>
          <tbody>
            {sla.map(s => (
              <tr key={s.id}>
                <td>{s.priority}</td>
                <td>
                  <input
                    type="number"
                    value={s.duration_hours}
                    onChange={(e) => updateSla(s.id, e.target.value)}
                    className="border px-2 py-1 w-20"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔹 CONFIG TICKETS */}
      <div className="bg-white p-4 rounded shadow space-y-4">

        <div>
          <h3 className="font-semibold">Priorités</h3>
          <div className="flex gap-2 flex-wrap">
            {priorities.map(p => (
              <span key={p} className="bg-blue-100 px-2 py-1 rounded">{p}</span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Statuts</h3>
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <span key={s} className="bg-green-100 px-2 py-1 rounded">{s}</span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Impact</h3>
          <div className="flex gap-2">
            {impact.map(i => (
              <span key={i} className="bg-yellow-100 px-2 py-1 rounded">{i}</span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Urgence</h3>
          <div className="flex gap-2">
            {urgency.map(u => (
              <span key={u} className="bg-red-100 px-2 py-1 rounded">{u}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}