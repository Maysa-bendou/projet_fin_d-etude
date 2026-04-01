import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const TicketDetailPage = () => {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showList, setShowList] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const sId = user.service_id;

  useEffect(() => {
    fetchTicket();
    fetchTechnicians();
  }, [id, sId]);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${id}`);
      const data = await res.json();
      setTicket(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/tech/users/service/${sId}`
      );
      const data = await res.json();
      setTechnicians(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async () => {
    if (!selectedTech) {
      setModalMessage("Please select a technician first!");
      setShowModal(true);
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicienId: selectedTech.id,
          action: isUpdating ? "updated" : "assigned",
          assigned_by: user.id,
        }),
      });

      if (res.ok) {
        setModalMessage(
          isUpdating
            ? `Ticket successfully reassigned to ${selectedTech.name}`
            : `Ticket successfully assigned to ${selectedTech.name}`
        );
        setShowModal(true);
      } else {
        setModalMessage("Operation failed.");
        setShowModal(true);
      }
    } catch (err) {
      setModalMessage("An error occurred.");
      setShowModal(true);
    }
  };

  // INSTANT NAVIGATION
  const handleCloseModal = () => {
    setShowModal(false);
    if (modalMessage.includes("successfully")) {
      navigate("/manager/tickets-service");
    }
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  const assignedTech = ticket?.technician || null;
  const isAssigned = !!assignedTech;

  return (
    <div className="relative min-h-screen bg-gray-100 p-10">
      
      {/* --- CENTERED CARD MESSAGE (NO BLACK OVERLAY) --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-gray-100 pointer-events-auto transform transition-all scale-100">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{modalMessage}</h3>
            <p className="text-indigo-600 font-medium mb-6">Status : Ouvert</p>
            <button 
              onClick={handleCloseModal}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      <div className={`max-w-6xl mx-auto grid grid-cols-3 gap-6 ${showModal ? 'opacity-40 select-none' : ''}`}>
        
        {/* LEFT COLUMN */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h1 className="text-2xl font-bold mb-2">{ticket.title}</h1>
            <p className="text-gray-500">{ticket.description}</p>
          </div>

          {/* TECH LIST SECTION */}
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
                        className={`p-4 rounded-xl cursor-pointer border transition ${
                          selectedTech?.id === tech.id
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-50 hover:bg-indigo-50"
                        }`}
                      >
                        <p className="font-semibold">
                          {tech.name} {tech.surname}
                        </p>
                        <p className="text-sm opacity-70">{tech.job_title}</p>
                      </div>
                    ))
                  ) : (
                    <p>No technicians found.</p>
                  )}
                </div>

                {/* RESTORED TECHNICIAN DETAILS */}
                <div className="bg-gray-900 text-white p-6 rounded-xl flex flex-col justify-between">
                  {selectedTech ? (
                    <>
                      <div>
                        <h3 className="text-xl font-bold mb-4">
                          {selectedTech.name} {selectedTech.surname}
                        </h3>
                        <p>📧 {selectedTech.email}</p>
                        <p>📞 {selectedTech.phone || "N/A"}</p>
                        <p>🏢 {selectedTech.office || "N/A"}</p>
                        <p>🛠 {selectedTech.job_title}</p>
                      </div>

                      <button
                        onClick={handleAssign}
                        className="mt-6 bg-indigo-500 hover:bg-indigo-400 py-3 rounded-lg font-bold"
                      >
                        Confirm {isUpdating ? "Update" : "Assignment"}
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-center">
                      Select a technician
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="bg-gray-900 text-white p-6 rounded-2xl shadow h-fit">
          <h3 className="font-bold mb-4">Manager Actions</h3>

          {!isAssigned && (
            <button
              onClick={() => setShowList(!showList)}
              className="w-full bg-indigo-600 py-3 rounded-xl font-bold"
            >
              {showList ? "Cancel" : "Assign Ticket"}
            </button>
          )}

          {isAssigned && !isUpdating && (
            <button
              onClick={() => {
                setIsUpdating(true);
                setShowList(true);
              }}
              className="w-full bg-yellow-500 py-3 rounded-xl font-bold text-black"
            >
              Update Assignment
            </button>
          )}

          {isAssigned && isUpdating && (
            <button
              onClick={() => {
                setIsUpdating(false);
                setShowList(false);
                setSelectedTech(null);
              }}
              className="w-full bg-gray-600 py-3 rounded-xl font-bold"
            >
              Cancel Update
            </button>
          )}

          {isAssigned && (
            <div className="mt-6 bg-gray-800 p-4 rounded-xl">
              <p className="text-xs text-indigo-400 mb-1">Currently assigned to:</p>
              <p className="font-bold">
                {assignedTech?.name || "Unknown"} {assignedTech?.surname || ""}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TicketDetailPage;