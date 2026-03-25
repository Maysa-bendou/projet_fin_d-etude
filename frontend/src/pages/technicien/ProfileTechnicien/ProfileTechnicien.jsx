import React from "react";
import {
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdWork,
  MdBuild
} from "react-icons/md";

export default function TechnicianProfile() {

  const user = {
    nom: "Benali",
    prenom: "Ali",
    email: "tech1@djezzy.dz",
    telephone: "0550 222 333",
    role: "Technicien",
    departement: "IT",
    poste: "Technicien Réseau",
    bureau: "Bureau 205",
    bloc: "B2",
    services: ["IT Support", "IT Network", "Maintenance"]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ───────── LEFT SIDE (PROFILE) ───────── */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">

        {/* Avatar */}
        <div className="
          w-24 h-24 rounded-full
          bg-blue-500 text-white
          flex items-center justify-center
          text-3xl font-bold mb-4
        ">
          {user.prenom[0]}{user.nom[0]}
        </div>

        {/* Nom */}
        <h2 className="text-lg font-semibold text-gray-800">
          {user.prenom} {user.nom}
        </h2>

        {/* Role + Poste */}
        <p className="text-gray-500 text-sm">{user.role}</p>
        <p className="text-blue-600 text-sm font-medium mb-4">
          {user.poste}
        </p>

        {/* Infos rapides */}
        <div className="w-full space-y-3 text-sm text-left mt-4">

          <div className="flex items-center gap-2 text-gray-600">
            <MdLocationOn className="text-red-500" />
            {user.bureau} — Bloc {user.bloc}
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <MdPhone className="text-green-500" />
            {user.telephone}
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <MdEmail className="text-blue-500" />
            {user.email}
          </div>

        </div>

      </div>

      {/* ───────── RIGHT SIDE ───────── */}
      <div className="lg:col-span-2 space-y-6">

        {/* ── INFOS PERSONNELLES ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6">

          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Informations personnelles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <p className="text-sm text-gray-500">Nom</p>
              <p className="font-medium text-gray-800">{user.nom}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Prénom</p>
              <p className="font-medium text-gray-800">{user.prenom}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{user.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Téléphone</p>
              <p className="font-medium text-gray-800">{user.telephone}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Rôle</p>
              <p className="font-medium text-gray-800">{user.role}</p>
            </div>

          </div>
        </div>

        {/* ── INFOS PROFESSIONNELLES ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6">

          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Informations professionnelles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <p className="text-sm text-gray-500">Département</p>
              <p className="font-medium text-gray-800">{user.departement}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Poste</p>
              <p className="font-medium text-gray-800">{user.poste}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Bureau</p>
              <p className="font-medium text-gray-800">{user.bureau}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Bloc</p>
              <p className="font-medium text-gray-800">{user.bloc}</p>
            </div>

          </div>
        </div>

        {/* ── SERVICES ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6">

          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MdBuild className="text-blue-500" />
            Services associés
          </h3>

          <div className="flex flex-wrap gap-2">
            {user.services.map((service, index) => (
              <span
                key={index}
                className="
                  px-3 py-1.5 rounded-full text-sm
                  bg-blue-50 text-blue-600
                  font-medium
                "
              >
                {service}
              </span>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}