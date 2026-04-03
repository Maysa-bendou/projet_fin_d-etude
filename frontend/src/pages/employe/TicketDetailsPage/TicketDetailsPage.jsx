import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// --- Helpers de style ---
function couleurStatut(statut) {
  switch (statut) {
    case "in_progress": return "bg-yellow-50 text-yellow-800";
    case "resolved": return "bg-green-50 text-green-800";
    case "open": return "bg-blue-50 text-blue-800";
    case "rejected": return "bg-red-50 text-red-800";
    case "closed": return "bg-gray-50 text-gray-600";
    default: return "bg-gray-50 text-gray-600";
  }
}

function couleurPriorite(priorite) {
  switch (priorite?.toLowerCase()) {
    case "high": return "bg-red-50 text-red-800";
    case "critical": return "bg-purple-50 text-purple-800 font-bold";
    case "medium": return "bg-yellow-50 text-yellow-800";
    case "low": return "bg-green-50 text-green-800";
    default: return "bg-gray-50 text-gray-600";
  }
}

function MetaItem({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Badge({ children, className }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${className}`}>
      {children}
    </span>
  );
}

export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [solutionResponse, setSolutionResponse] = useState("");
  const [infoFiles, setInfoFiles] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [sendingInfo, setSendingInfo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const PRIORITY_MATRIX = {
    high:   { high: "critical", medium: "high",   low: "medium" },
    medium: { high: "high",     medium: "medium", low: "low"    },
    low:    { high: "medium",   medium: "low",    low: "low"    },
  };

  const fetchTicket = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tickets/${id}`);
      if (!res.ok) throw new Error("Ticket non trouvé");
      const data = await res.json();

      setTicket({
        titre: data.title,
        description: data.description,
        statut: data.status,
        priorite: data.priority || "Normale",
        categorie: data.category || "N/A",
        serviceIT: data.service || "N/A",
        technicien: data.technician
          ? `${data.technician.name || ""} ${data.technician.surname || ""}`.trim()
          : "Non assigné",
        impact: data.impact || "low",
        urgence: data.urgency || "low",
        type: data.type || "N/A",
        dateCreation: data.createdAt ? data.createdAt.split("T")[0] : "N/A",
        derniereMaj: data.updatedAt 
  ? new Date(data.updatedAt).toLocaleString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }) 
  : "N/A",
        sla_due_date: data.sla_due_date ? data.sla_due_date.split("T")[0] : "N/A",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleFieldChange = (field, value) => {
    setTicket(prev => {
      const updated = { ...prev, [field]: value };
      if (field === "impact" || field === "urgence") {
        updated.priorite = PRIORITY_MATRIX[updated.impact][updated.urgence];
      }
      return updated;
    });
  };

  const handleUpdateTicket = async () => {
    if (!ticket) return;
    setUpdating(true);
    try {
      // Si on réouvre un ticket fermé, on force le statut à "open"
      const payload = {
        title: ticket.titre,
        description: ticket.description,
        impact: ticket.impact,
        urgency: ticket.urgence,
        ...(ticket.statut === "closed" && { status: "open" })
      };

      const response = await fetch(`http://localhost:3001/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");
      
      setIsEditing(false);
      alert(ticket.statut === "closed" ? "Ticket réouvert et mis à jour." : "Ticket mis à jour avec succès.");
      fetchTicket(); // Refresh pour voir le nouveau statut et date MAJ
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendInfo = async () => {
    if (!infoFiles) return alert("Veuillez sélectionner au moins un fichier.");
    setSendingInfo(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < infoFiles.length; i++) {
        formData.append("files", infoFiles[i]);
      }
      const response = await fetch(`http://localhost:3001/api/tickets/${id}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Erreur lors de l'envoi des fichiers");
      alert("Informations envoyées avec succès au technicien.");
      setInfoFiles(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingInfo(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement du ticket...</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-500 text-sm">{error}</div>;
  if (!ticket) return null;

  const initiales = ticket.technicien.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white px-6 py-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-1 text-sm text-gray-500">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 hover:text-indigo-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
          <span>/ Mes Tickets /</span>
          <span className="font-medium text-gray-600">#{id}</span>
        </div>

        <div className="flex flex-wrap justify-between items-center mt-4 gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {isEditing ? (
              <input 
                className="text-3xl font-bold text-gray-900 border-b-2 border-indigo-500 outline-none bg-transparent"
                value={ticket.titre}
                onChange={(e) => handleFieldChange("titre", e.target.value)}
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-900">{ticket.titre}</h1>
            )}
            <Badge className={couleurStatut(ticket.statut)}>{ticket.statut}</Badge>
          </div>
          
          <div className="flex items-center gap-4">
            {isEditing ? (
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 shadow-sm"
              >
                Annuler
              </button>
            ) : (
              <>
                {ticket.statut === "closed" ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md transition"
                  >
                    Réouvrir le ticket
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 shadow-sm"
                  >
                    Modifier
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-3xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Technicien assigné</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">{initiales}</div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{ticket.technicien}</p>
                <p className="text-xs text-gray-500">Technicien IT</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Détails du ticket</p>
            
            <MetaItem label="Impact">
              {isEditing ? (
                <select value={ticket.impact} onChange={(e) => handleFieldChange("impact", e.target.value)} className="border rounded-lg p-1 text-sm w-full">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <p className="text-sm font-medium text-gray-800">{ticket.impact}</p>
              )}
            </MetaItem>

            <MetaItem label="Urgence">
              {isEditing ? (
                <select value={ticket.urgence} onChange={(e) => handleFieldChange("urgence", e.target.value)} className="border rounded-lg p-1 text-sm w-full">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <p className="text-sm font-medium text-gray-800">{ticket.urgence}</p>
              )}
            </MetaItem>

            <MetaItem label="Catégorie"><Badge className="bg-purple-100 text-purple-800">{ticket.categorie}</Badge></MetaItem>
            <MetaItem label="Service IT"><Badge className="bg-blue-100 text-blue-800">{ticket.serviceIT}</Badge></MetaItem>
            <MetaItem label="Type"><p className="text-sm font-medium text-gray-800">{ticket.type}</p></MetaItem>
            <MetaItem label="Créé le"><p className="text-sm font-medium text-gray-800">{ticket.dateCreation}</p></MetaItem>
            <MetaItem label="Dernière MAJ"><p className="text-sm font-medium text-indigo-600">{ticket.derniereMaj}</p></MetaItem>
            <MetaItem label="Priorité (Calculée)"><Badge className={couleurPriorite(ticket.priorite)}>{ticket.priorite}</Badge></MetaItem>

            {isEditing && (
              <button 
                onClick={handleUpdateTicket} 
                disabled={updating} 
                className="mt-4 w-full py-3 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition"
              >
                {updating ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-white rounded-3xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Description</p>
            {isEditing ? (
              <textarea className="w-full p-3 border rounded-xl text-sm" rows={5} value={ticket.description} onChange={(e) => handleFieldChange("description", e.target.value)} />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed">{ticket.description}</p>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Solution proposée par le technicien</p>
            <textarea disabled value="La solution du technicien est chargée ici..." rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 resize-none mb-4 cursor-default" />
            <p className="text-xs text-gray-400 font-medium mb-2">La solution vous convient-elle ?</p>
            <div className="flex gap-3">
              <button onClick={() => setSolutionResponse("Oui")} className={`px-6 py-2 rounded-2xl text-sm font-medium transition-all ${solutionResponse === "Oui" ? "bg-green-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"}`}>Oui, résolu</button>
              <button onClick={() => setSolutionResponse("Non")} className={`px-6 py-2 rounded-2xl text-sm font-medium transition-all ${solutionResponse === "Non" ? "bg-red-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"}`}>Non, problème persistant</button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Demande d'informations du technicien</p>
            <textarea disabled value="Le technicien demande plus d'informations..." rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 resize-none mb-4 cursor-default" />
            <label className="block text-xs text-gray-400 font-medium mb-2">Joindre des fichiers</label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center hover:border-indigo-300 transition-colors cursor-pointer mb-4">
              <input type="file" multiple onChange={(e) => setInfoFiles(e.target.files)} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="flex flex-col items-center gap-1 cursor-pointer">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <span className="text-sm text-gray-400">{infoFiles ? `${infoFiles.length} fichier(s) sélectionné(s)` : "Cliquez pour choisir des fichiers"}</span>
              </label>
            </div>
            
            <button 
              onClick={handleSendInfo}
              disabled={sendingInfo || !infoFiles}
              className={`w-full py-3 rounded-2xl font-bold transition shadow-lg ${!infoFiles ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
            >
              {sendingInfo ? "Envoi en cours..." : "Envoyer les informations au technicien"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}