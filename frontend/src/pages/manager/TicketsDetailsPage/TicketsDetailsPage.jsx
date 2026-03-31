import React, { useState, useEffect } from "react";
import { useParams , useNavigate } from "react-router-dom";

const TicketDetailPage = () => {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showList, setShowList] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const sId = user.service_id;
  console.log(user);

  useEffect(() => {
    fetchTicket();
    fetchTechnicians();
  }, [id, sId]);

  const fetchTicket = async () => {
    const res = await fetch(`http://localhost:3001/api/tickets/${id}`);
    const data = await res.json();
    setTicket(data);
    setLoading(false);
  };

const fetchTechnicians = async () => {
  try {
    console.log("Service ID:", sId); // 🔍 DEBUG

    const res = await fetch(`http://localhost:3001/api/tech/users/service/${sId}`);
    const data = await res.json();

    console.log("Technicians:", data); // 🔍 DEBUG

    setTechnicians(data);
  } catch (err) {
    console.error(err);
  }
};

const handleAssign = async () => {
  if (!selectedTech) return alert("Select a technician first!");

  try {
    const res = await fetch(`http://localhost:3001/api/tickets/${id}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technicienId: selectedTech.id, action: "assigned", assigned_by: user.id }),
    });

    if (res.ok) {
      alert(`Ticket assigned to ${selectedTech.name}`);
      navigate("/manager/tickets-service");
    } else {
      alert("Assignment failed");
    }
  } catch (err) {
    console.error(err);
  }
};


async function assignerTicket(ticketId, technicienId) {
  const manager = JSON.parse(localStorage.getItem("user"));
  await fetch(`http://localhost:3001/api/tickets/${ticketId}/assign`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assigned_to: technicienId, action: "assigned", assigned_by: manager.id }),
  });
  alert("Ticket assigné !");
}
  if (loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6">

        {/* LEFT SIDE */}
        <div className="col-span-2 space-y-6">

          {/* Ticket */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h1 className="text-2xl font-bold mb-2">{ticket.title}</h1>
            <p className="text-gray-500">{ticket.description}</p>
          </div>

          {/* TECH LIST */}
          {showList && (
            <div className="bg-white p-6 rounded-2xl shadow border">
              <h2 className="text-lg font-bold mb-4 text-indigo-600">
                Select Technician
              </h2>

              <div className="grid grid-cols-2 gap-6">

                {/* LIST */}
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {technicians.length > 0 ? (
                    technicians.map((tech) => (
                      <div
                        key={tech.id}
                        onClick={() => setSelectedTech(tech)}
                        className={`p-4 rounded-xl cursor-pointer border transition 
                        ${
                          selectedTech?.id === tech.id
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-50 hover:bg-indigo-50"
                        }`}
                      >
                        <p className="font-semibold">
                          {tech.name} {tech.surname}
                        </p>
                        <p className="text-sm opacity-70">
                          {tech.job_title}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p>No technicians found.</p>
                  )}
                </div>

                {/* DETAILS */}
                <div className="bg-gray-900 text-white p-6 rounded-xl flex flex-col justify-between">
                  {selectedTech ? (
                    <>
                      <div>
                        <h3 className="text-xl font-bold mb-4">
                          {selectedTech.name} {selectedTech.surname}
                        </h3>

                        <p>📧 {selectedTech.email}</p>
                        <p>📞 {selectedTech.phone || "N/A"}</p>
                        <p>🏢 Office: {selectedTech.office || "N/A"}</p>
                        <p>🛠 {selectedTech.job_title}</p>
                      </div>

                      <button
                        onClick={handleAssign}
                        className="mt-6 bg-indigo-500 hover:bg-indigo-400 py-3 rounded-lg font-bold"
                      >
                        Confirm Assignment
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-center">
                      Select a technician to see details
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="bg-gray-900 text-white p-6 rounded-2xl shadow h-fit">
          <h3 className="font-bold mb-4">Manager Actions</h3>

          <button
            onClick={() => setShowList(!showList)}
            className="w-full bg-indigo-600 py-3 rounded-xl font-bold hover:scale-105 transition"
          >
            {showList ? "Cancel" : "Assign Ticket"}
          </button>

          {ticket?.users_tickets_assigned_toTousers && (
            <div className="mt-6 bg-gray-800 p-4 rounded-xl">
              <p className="text-xs text-indigo-400 mb-1">
                Currently assigned to:
              </p>
              <p className="font-bold">
                {ticket.users_tickets_assigned_toTousers.name}{" "}
                {ticket.users_tickets_assigned_toTousers.surname}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TicketDetailPage;