import { useState } from "react";

export default function CreateTicketPage() {

  const [type, setType] = useState("incident");

  return (

    <div className="min-h-screen bg-gray-100 flex justify-center items-center">

      <div className="w-full max-w-5xl bg-white shadow-lg rounded-lg">

        {/* HEADER */}
        <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h1 className="text-lg font-semibold"> Créer une requête</h1>
          <span className="text-sm">Djezzy IT Helpdesk</span>
        </div>

        {/* FORM */}
        <div className="p-6 grid grid-cols-2 gap-6">

          {/* LEFT */}
          <div className="space-y-4">

            <div>
              <label className="text-sm font-medium">Type de requête *</label>
              <select
                value={type}
                onChange={(e)=>setType(e.target.value)}
                className="w-full border rounded p-2 mt-1"
              >
                <option>Incident</option>
                <option>Demande</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Titre *</label>
              <input
                type="text"
                placeholder="Ex: Impossible de se connecter au VPN"
                className="w-full border rounded p-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description *</label>
              <textarea
                rows="4"
                placeholder="Décrivez votre problème..."
                className="w-full border rounded p-2 mt-1"
              />
            </div>



          </div>

          {/* RIGHT */}
          <div className="space-y-4">

            <div>
              <label className="text-sm font-medium">Impact</label>
              <select className="w-full border rounded p-2 mt-1">
                <option>Une personne</option>
                <option>Un service</option>
                <option>Entreprise complète</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Urgence</label>
              <select className="w-full border rounded p-2 mt-1">
                <option>This issue disrupts my work</option>
                <option>I am blocked from doing my job</option>
                <option>This issue partially blocks my work</option>
                <option>I can continue to work</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Solutions proposées</label>
              <div className="border rounded p-3 bg-gray-50 text-sm">
                L'IA proposera ici des solutions similaires...
              </div>
            </div>

<div>
  <label className="text-sm font-medium">Pièces jointes</label>
  <input
    type="file"
    className="w-full border rounded p-2 mt-1"
    accept="*/*"  // <- allows all file types
  />
</div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="flex justify-between p-6 pt-0">

          <button className="px-6 py-2 border rounded hover:bg-gray-100">
            Annuler
          </button>

          <button className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Créer le ticket
          </button>

        </div>

      </div>

    </div>

  );
}
