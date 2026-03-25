import React, { useState } from "react";
import { MdEmail, MdPhone, MdLocationOn, MdWork, MdLock } from "react-icons/md";

export default function Profile() {

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

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUser({ ...user, avatar: URL.createObjectURL(file) });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* LEFT SIDE */}
      <div className="lg:col-span-2 space-y-6">

        {/* ── INFOS PERSONNELLES ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6">

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Informations personnelles
            </h3>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600"
            >
              {isEditing ? "Annuler" : "Modifier"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {["nom", "prenom", "email", "telephone", "role"].map((field) => (
              <div key={field}>
                <p className="text-sm text-gray-500 capitalize">{field}</p>

                {isEditing ? (
                  <input
                    type="text"
                    name={field}
                    value={user[field]}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  />
                ) : (
                  <p className="font-medium text-gray-800">{user[field]}</p>
                )}
              </div>
            ))}

          </div>
        </div>

        {/* ── INFOS PROFESSIONNELLES ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6">

          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Informations professionnelles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {["departement", "poste", "bureau", "bloc"].map((field) => (
              <div key={field}>
                <p className="text-sm text-gray-500 capitalize">{field}</p>

                {isEditing ? (
                  <input
                    type="text"
                    name={field}
                    value={user[field]}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  />
                ) : (
                  <p className="font-medium text-gray-800">{user[field]}</p>
                )}
              </div>
            ))}

          </div>
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="space-y-6">

        {/* ── PROFILE CARD ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">

          {/* Avatar */}
          <div className="relative w-fit mx-auto">
            <div className="
              w-20 h-20 rounded-full
              bg-blue-500 text-white
              flex items-center justify-center
              text-2xl font-bold overflow-hidden
            ">
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user.prenom[0] + user.nom[0]
              )}
            </div>

            {/* Upload bouton */}
            <label className="
              absolute bottom-0 right-0
              bg-white border rounded-full p-1 cursor-pointer
              shadow
            ">
              📸
              <input type="file" hidden onChange={handleImageChange} />
            </label>
          </div>

          <h2 className="mt-4 font-semibold text-gray-800">
            {user.prenom} {user.nom}
          </h2>

          <p className="text-gray-500 text-sm">{user.role}</p>
          <p className="text-blue-600 text-sm font-medium mb-4">
            {user.poste}
          </p>

          <div className="space-y-2 text-sm text-left">

            <div className="flex items-center gap-2">
              <MdLocationOn className="text-red-500" />
              {user.bureau} — Bloc {user.bloc}
            </div>

            <div className="flex items-center gap-2">
              <MdPhone className="text-green-500" />
              {user.telephone}
            </div>

            <div className="flex items-center gap-2">
              <MdEmail className="text-blue-500" />
              {user.email}
            </div>

          </div>

        </div>

        {/* ── SECURITY CARD ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6">

          <div className="flex items-center gap-2 mb-3">
            <MdLock className="text-gray-600" />
            <h3 className="font-semibold text-gray-700">Sécurité</h3>
          </div>

          <p className="text-sm text-gray-500">Mot de passe</p>
          <p className="text-gray-800 font-medium">••••••••</p>

          <p className="text-xs text-gray-400 mt-1">
            Dernière modification il y a 30 jours
          </p>

          <button className="
            mt-4 w-full
            bg-gray-100 text-gray-700 py-2 rounded-lg
            hover:bg-gray-200 transition
          ">
            Changer le mot de passe
          </button>

        </div>

      </div>

    </div>
  );
}