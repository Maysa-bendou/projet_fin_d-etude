import React, { useState } from "react";
import { MdEmail, MdPhone, MdLocationOn, MdLock, MdEdit, MdCheck, MdClose } from "react-icons/md";

export default function ProfilePage() {

  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState({
    nom: "Benali",
    prenom: "Ali",
    email: "employe1@djezzy.dz",
    telephone: "0550 111 001",
    role: "Employé",
    departement: "Finance",
    poste: "Analyste Financier",
    bureau: "Bureau 101",
    bloc: "B1",
    avatar: null
  });

  // ── Sauvegarde temporaire pour annuler ────────
  const [savedUser, setSavedUser] = useState(user);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUser({ ...user, avatar: URL.createObjectURL(file) });
    }
  };

  // ── Sauvegarder les modifications ────────────
  function handleSave() {
    setSavedUser(user);
    setIsEditing(false);
  }

  // ── Annuler — remet les données sauvegardées ─
  function handleCancel() {
    setUser(savedUser);
    setIsEditing(false);
  }

  // ── Labels lisibles pour les champs ──────────
  const labels = {
    nom: "Nom",
    prenom: "Prénom",
    email: "Email",
    telephone: "Téléphone",
    role: "Rôle",
    departement: "Département",
    poste: "Poste",
    bureau: "Bureau",
    bloc: "Bloc",
  };

  return (
    <div className="p-6">

      {/* ── Titre page ── */}
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Mon Profil
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ════ GAUCHE ════ */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Carte Infos personnelles ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

            {/* Header carte */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold text-gray-700">
                Informations personnelles
              </h3>

              {/* Boutons Modifier / Sauvegarder / Annuler */}
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MdEdit size={16} />
                  Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MdCheck size={16} />
                    Sauvegarder
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <MdClose size={16} />
                    Annuler
                  </button>
                </div>
              )}
            </div>

            {/* Champs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {["nom", "prenom", "email", "telephone", "role"].map((field) => (
                <div key={field}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {labels[field]}
                  </p>
                  {isEditing && field !== "role" ? (
                    <input
                      type="text"
                      name={field}
                      value={user[field]}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                    />
                  ) : (
                    field === "role" ? (
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                        {user[field]}
                      </span>
                    ) : (
                      <p className="text-sm font-medium text-gray-800">{user[field]}</p>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Carte Infos professionnelles ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-700 mb-5">
              Informations professionnelles
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {["departement", "poste", "bureau", "bloc"].map((field) => (
                <div key={field}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {labels[field]}
                  </p>
                  {isEditing ? (
                    <input
                      type="text"
                      name={field}
                      value={user[field]}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-800">{user[field]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ════ DROITE ════ */}
        <div className="space-y-5">

          {/* ── Carte profil ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">

            {/* Avatar */}
            <div className="relative w-fit mx-auto mb-4">
              <div className="
                w-20 h-20 rounded-full
                bg-gradient-to-br from-blue-500 to-purple-600
                flex items-center justify-center
                text-white text-2xl font-bold
                overflow-hidden
              ">
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  user.prenom[0] + user.nom[0]
                )}
              </div>

              {/* Bouton upload photo */}
              <label className="
                absolute bottom-0 right-0
                bg-white border border-gray-200
                rounded-full p-1 cursor-pointer shadow-sm
                hover:bg-gray-50 transition-colors
              ">
                📸
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </label>
            </div>

            {/* Nom + rôle + poste */}
            <h2 className="font-semibold text-gray-800 text-lg">
              {user.prenom} {user.nom}
            </h2>
            <span className="inline-block bg-blue-50 text-blue-700 px-3 py-0.5 rounded-full text-xs font-medium mt-1 mb-1">
              {user.role}
            </span>
            <p className="text-blue-600 text-sm font-medium mb-4">
              {user.poste}
            </p>

            {/* Infos rapides */}
            <div className="space-y-2 text-sm text-left border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MdLocationOn className="text-red-400 shrink-0" size={16} />
                <span>{user.bureau} — Bloc {user.bloc}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MdPhone className="text-green-500 shrink-0" size={16} />
                <span>{user.telephone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MdEmail className="text-blue-500 shrink-0" size={16} />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>

          {/* ── Carte Sécurité ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MdLock className="text-gray-500" size={18} />
              <h3 className="font-semibold text-gray-700">Sécurité</h3>
            </div>

            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Mot de passe
            </p>
            <p className="text-gray-800 font-medium text-sm mb-1">
              ••••••••
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Dernière modification il y a 30 jours
            </p>

            <button className="
              w-full bg-gray-50 text-gray-700
              py-2 rounded-lg text-sm font-medium
              border border-gray-200
              hover:bg-gray-100 transition-colors
            ">
              Changer le mot de passe
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}