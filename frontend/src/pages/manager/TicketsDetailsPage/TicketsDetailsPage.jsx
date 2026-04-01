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

  const handleCloseModal = () => {
    setShowModal(false);
    if (modalMessage.includes("successfully")) {
      navigate("/manager/tickets-service");
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-red-600">Loading...</div>;

  const assignedTech = ticket?.technician || null;
  const isAssigned = !!assignedTech;

  return (
    <div className="relative min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
      
      {/* --- MODAL (DJEEZY RED STYLE) --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border-t-8 border-red-600 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase">{modalMessage}</h3>
            <p className="text-red-600 font-bold mb-6 italic uppercase text-xs tracking-widest">Status : Open</p>
            <button 
              onClick={handleCloseModal}
              className="w-full bg-black text-white py-4 rounded-xl font-black uppercase hover:bg-red-700 transition shadow-lg"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      <div className={`max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all ${showModal ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
        
        {/* --- LEFT COLUMN: TICKET INFO & TECH SELECTION --- */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TICKET DETAILS */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
               <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase">Ticket Detail</span>
               <span className="text-gray-300 font-bold"># {id}</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-4 uppercase italic tracking-tight">{ticket.title}</h1>
            <p className="text-gray-500 leading-relaxed border-l-4 border-red-100 pl-6">{ticket.description}</p>
          </div>

          {/* TECHNICIAN SELECTION LIST (FULL INFO KEPT) */}
          {showList && (
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-50 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-black mb-8 text-gray-900 uppercase tracking-widest border-b-2 border-red-600 w-fit pb-1">
                Select Technician
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SCROLLABLE LIST */}
                <div className="max-h-[450px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {technicians.length > 0 ? (
                    technicians.map((tech) => (
                      <div
                        key={tech.id}
                        onClick={() => setSelectedTech(tech)}
                        className={`p-5 rounded-2xl cursor-pointer border-2 transition-all ${
                          selectedTech?.id === tech.id
                            ? "border-red-600 bg-red-50"
                            : "border-gray-50 bg-gray-50 hover:border-red-200"
                        }`}
                      >
                        <p className={`font-black uppercase text-sm ${selectedTech?.id === tech.id ? "text-red-600" : "text-gray-900"}`}>
                          {tech.name} {tech.surname}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 italic">{tech.job_title}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic">No technicians found.</p>
                  )}
                </div>

                {/* TECHNICIAN FULL DETAILS (ALL DATA RESTORED) */}
                <div className="bg-black text-white p-8 rounded-3xl flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  
                  {selectedTech ? (
                    <>
                      <div>
                        <div className="w-10 h-1 bg-red-600 mb-6"></div>
                        <h3 className="text-2xl font-black mb-8 uppercase italic leading-none">
                          {selectedTech.name} <br/> 
                          <span className="text-red-600">{selectedTech.surname}</span>
                        </h3>
                        
                        <div className="space-y-4 text-sm font-bold tracking-wide">
                          <div className="flex items-center gap-3 text-gray-300">
                             <span className="text-red-600">Email:</span> {selectedTech.email}
                          </div>
                          <div className="flex items-center gap-3 text-gray-300">
                             <span className="text-red-600">Phone:</span> {selectedTech.phone || "N/A"}
                          </div>
                          <div className="flex items-center gap-3 text-gray-300">
                             <span className="text-red-600">Office:</span> {selectedTech.office || "N/A"}
                          </div>
                          <div className="flex items-center gap-3 text-gray-300 border-t border-gray-800 pt-4 mt-4">
                             <span className="text-red-600">Role:</span> {selectedTech.job_title}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleAssign}
                        className="mt-10 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-600/20"
                      >
                        Confirm {isUpdating ? "Update" : "Assignment"}
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-800 flex items-center justify-center text-2xl font-black">?</div>
                      <p className="text-[10px] uppercase font-black tracking-[0.3em]">Select a profile</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: MANAGER ACTIONS (STAYS FIXED) --- */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-10">
            <h3 className="font-black text-gray-900 mb-8 uppercase tracking-[0.2em] text-xs border-b border-gray-50 pb-4 italic">Manager Controls</h3>

            <div className="space-y-4">
              {!isAssigned && (
                <button
                  onClick={() => setShowList(!showList)}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-600/20"
                >
                  {showList ? "Cancel Operation" : "Assign Ticket"}
                </button>
              )}

              {isAssigned && !isUpdating && (
                <button
                  onClick={() => {
                    setIsUpdating(true);
                    setShowList(true);
                  }}
                  className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition shadow-lg"
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
                  className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition"
                >
                  Cancel Update
                </button>
              )}
            </div>

            {/* CURRENT ASSIGNMENT DISPLAY (RESTORED INFO) */}
            {isAssigned && (
              <div className="mt-10 pt-8 border-t-2 border-gray-50">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-4">Currently Assigned To</p>
                <div className="flex items-center gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-black italic text-xl">
                    {assignedTech?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-gray-900 uppercase text-sm">
                      {assignedTech?.name || "Unknown"} {assignedTech?.surname || ""}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Verified Technician</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TicketDetailPage;