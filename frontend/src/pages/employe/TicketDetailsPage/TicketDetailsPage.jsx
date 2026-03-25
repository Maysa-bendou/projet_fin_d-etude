import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function couleurStatut(statut) {
  if (statut === "En cours") return "bg-yellow-100 text-yellow-700";
  if (statut === "Résolu") return "bg-green-100 text-green-700";
  if (statut === "En attente") return "bg-blue-100 text-blue-700";
  if (statut === "Rejeté") return "bg-red-100 text-red-700";
  if (statut === "Fermé") return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-600";
}

function couleurPriorite(priorite) {
  if (priorite === "Haute") return "bg-red-100 text-red-700";
  if (priorite === "Normale") return "bg-yellow-100 text-yellow-700";
  if (priorite === "Basse") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-600";
}

export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
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

  useEffect(() => {
    async function fetchTicket() {
      try {
        const res = await fetch(`http://localhost:3001/api/tickets/${id}`);
        if (!res.ok) throw new Error("Ticket non trouvé");
        const data = await res.json();

        const formattedTicket = {
          titre: data.title,
          description: data.description,
          statut:
            data.status === "open"
              ? "En attente"
              : data.status === "in_progress"
              ? "En cours"
              : data.status === "resolved"
              ? "Résolu"
              : data.status === "closed"
              ? "Fermé"
              : data.status === "rejected"
              ? "Rejeté"
              : data.status,
          priorite: data.priority || "Normale",
          categorie: data.category || "N/A",
          serviceIT: data.service_id ? services[data.service_id - 1] : "N/A",
          technicien: data.technicien_name || "Non assigné",
          impact: data.impact || "Toute l'entreprise",
          urgence: data.urgency || "Moyenne",
          dateCreation: data.created_at ? data.created_at.split("T")[0] : "N/A",
          derniereMaj: data.updated_at
            ? data.updated_at.replace("T", " ").substring(0, 16)
            : "N/A",
        };

        setTicket(formattedTicket);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();
  }, [id]);

  if (loading) return <div className="p-6">Chargement du ticket...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!ticket) return null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-white border border-gray-200 text-gray-500 hover:text-red-600 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-gray-800">Détails du ticket</h1>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "260px 1fr" }}>
        {/* GAUCHE */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5 h-fit">

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Statut</p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${couleurStatut(ticket.statut)}`}>
              {ticket.statut}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Priorité</p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${couleurPriorite(ticket.priorite)}`}>
              {ticket.priorite}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Technicien</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-900 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {ticket.technicien.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <span className="text-sm text-gray-700">{ticket.technicien}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Créé le</p>
            <p className="text-sm font-medium text-gray-800">{ticket.dateCreation}</p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Dernière MAJ</p>
            <p className="text-sm font-medium text-gray-800">{ticket.derniereMaj}</p>
          </div>
        </div>

        {/* DROITE */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Titre</p>
            <p className="text-base font-semibold text-gray-800 mb-4">{ticket.titre}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-500 leading-relaxed">{ticket.description}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Catégorie & Service</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-2">Catégorie</p>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">{ticket.categorie}</span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Service IT</p>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">{ticket.serviceIT}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Priorité</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Impact</p>
                <p className="text-sm font-medium text-gray-800">{ticket.impact}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Urgence</p>
                <p className="text-sm font-medium text-gray-800">{ticket.urgence}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Priorité</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${couleurPriorite(ticket.priorite)}`}>
                  {ticket.priorite}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}