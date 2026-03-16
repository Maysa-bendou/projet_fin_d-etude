import React from "react";
export default function ProfilePage() {
  const user = {
    nom: "Boualouache",
    prenom: "Anfel",
    telephone: "+213 555 123 456",
    bloc: "B12",
    email: "anfel.boualouache@djezzy.com",
    departement: "Support IT & Matériel",
    poste: "Technicien Support",
    bureau: "203",
    avatar: "/images/avatar.png"
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center space-x-4 mb-6">
        <img
          src={user.avatar}
          alt="Avatar"
          className="w-20 h-20 rounded-full border-2 border-red-600"
        />
        <h2 className="text-2xl font-bold">{user.prenom} {user.nom}</h2>
      </div>

      <div className="space-y-2 text-gray-700">
        <p><span className="font-semibold">Email :</span> {user.email}</p>
        <p><span className="font-semibold">Téléphone :</span> {user.telephone}</p>
        <p><span className="font-semibold">Département :</span> {user.departement}</p>
        <p><span className="font-semibold">Poste :</span> {user.poste}</p>
        <p><span className="font-semibold">Bureau :</span> {user.bureau}</p>
        <p><span className="font-semibold">Bloc :</span> {user.bloc}</p>
      </div>
    </div>
  );
}
