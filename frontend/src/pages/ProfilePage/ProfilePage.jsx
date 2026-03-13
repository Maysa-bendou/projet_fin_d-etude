import React from "react";
import "./ProfilePage.css";

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
    avatar: "/images/avatar.png" // mets la vraie photo ici
  };

  return (
    <div className="profile-container">
      {/* En-tête avec photo et nom complet */}
      <div className="profile-header">
        <img src={user.avatar} alt="Avatar" className="profile-avatar" />
        <h2>{user.prenom} {user.nom}</h2>
      </div>

      {/* Informations détaillées */}
      <div className="profile-info">
        <p><strong>Email :</strong> {user.email}</p>
        <p><strong>Téléphone :</strong> {user.telephone}</p>
        <p><strong>Département :</strong> {user.departement}</p>
        <p><strong>Poste :</strong> {user.poste}</p>
        <p><strong>Bureau :</strong> {user.bureau}</p>
        <p><strong>Bloc :</strong> {user.bloc}</p>
      </div>
    </div>
  );
}
