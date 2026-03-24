import { useNavigate } from "react-router-dom";

const fakeTicket = {
  id: "IM000007",
  titre: "File d'attente SM9 vide côté utilisateur",
  description: "La file d'attente SM9 est vide du côté utilisateur depuis ce matin.",
  categorie: "Logiciels",
  serviceIT: "IT Support",
  statut: "Rejeté",
  technicien: "Ahmed Benali",
  impact: "Toute l'entreprise",
  urgence: "Élevé",
  priorite: "Haute",
  dateCreation: "2026-03-15",
  derniereMaj: "2026-03-15 10:23",
};

function couleurStatut(statut) {
  if (statut === "En cours")   return "bg-yellow-100 text-yellow-700";
  if (statut === "Résolu")     return "bg-green-100 text-green-700";
  if (statut === "En attente") return "bg-blue-100 text-blue-700";
  if (statut === "Rejeté")     return "bg-red-100 text-red-700";
  if (statut === "Fermé")      return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-600";
}

function couleurPriorite(priorite) {
  if (priorite === "Haute")   return "bg-red-100 text-red-700";
  if (priorite === "Normale") return "bg-yellow-100 text-yellow-700";
  if (priorite === "Basse")   return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-600";
}

export default function TicketDetailsPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6">

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-white border border-gray-200 text-gray-500 hover:text-red-600 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          Détails du ticket
        </h1>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "260px 1fr" }}>

        {/* GAUCHE */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5 h-fit">

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">ID</p>
            <p className="text-sm font-semibold font-mono text-gray-800">{fakeTicket.id}</p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Statut</p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${couleurStatut(fakeTicket.statut)}`}>
              {fakeTicket.statut}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Priorité</p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${couleurPriorite(fakeTicket.priorite)}`}>
              {fakeTicket.priorite}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Technicien</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-900 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {fakeTicket.technicien.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <span className="text-sm text-gray-700">{fakeTicket.technicien}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Créé le</p>
            <p className="text-sm font-medium text-gray-800">{fakeTicket.dateCreation}</p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Dernière MAJ</p>
            <p className="text-sm font-medium text-gray-800">{fakeTicket.derniereMaj}</p>
          </div>

        </div>

        {/* DROITE */}
        <div className="flex flex-col gap-4">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Titre</p>
            <p className="text-base font-semibold text-gray-800 mb-4">{fakeTicket.titre}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-500 leading-relaxed">{fakeTicket.description}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Catégorie & Service</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-2">Catégorie</p>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                  {fakeTicket.categorie}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Service IT</p>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                  {fakeTicket.serviceIT}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Priorité</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Impact</p>
                <p className="text-sm font-medium text-gray-800">{fakeTicket.impact}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Urgence</p>
                <p className="text-sm font-medium text-gray-800">{fakeTicket.urgence}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Priorité</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${couleurPriorite(fakeTicket.priorite)}`}>
                  {fakeTicket.priorite}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}