import React, { useState, useEffect } from "react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3001/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Erreur lors du chargement");

        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError("Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">Chargement du profil...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );

  const initials = `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-6 mt-10">

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 text-2xl font-bold flex items-center justify-center border-2 border-red-600 shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {user.name} {user.surname}
          </h2>
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
            {user.role}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-3 text-sm text-gray-700">
        {[
          { label: "Email",       value: user.email },
          { label: "Téléphone",   value: user.phone        ?? "—" },
          { label: "Département", value: user.department   ?? "—" },
          { label: "Poste",       value: user.job_title    ?? "—" },
          { label: "Bureau",      value: user.office       ?? "—" },
          { label: "Bloc",        value: user.block_number ?? "—" },
        ].map((f) => (
          <div key={f.label} className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="font-semibold text-gray-500">{f.label}</span>
            <span className="text-gray-900">{f.value}</span>
          </div>
        ))}
      </div>

    </div>
  );
}