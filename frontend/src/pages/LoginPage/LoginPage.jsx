import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, AlertCircle, HeadsetIcon } from "lucide-react";
import djezzyLogoImg from "../../assets/images/Logo_Djezzy.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de connexion");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      const roles = { admin: "/admin", technician: "/technician", chef_service: "/chef", manager: "/manager" };
      navigate(roles[data.user.role] || "/employee");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f3ef] px-4 relative overflow-hidden">
      {/* Blobs */}
     
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">

        {/* Header: logo left + title center aligned */}
        <div className="flex items-center mb-2">
          <img src={djezzyLogoImg} alt="Djezzy" className="h-12 w-auto flex-shrink-0" />
          <h1 className="flex-1 text-center text-2xl font-extrabold text-gray-800 -ml-12">
            Connexion
          </h1>
        </div>

        <p className="text-center text-sm text-gray-400 mb-7">
          Connectez-vous avec vos coordonnées professionnelles
        </p>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Email professionnel
            </label>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 focus-within:border-red-400 focus-within:bg-white transition-all">
              <Mail size={17} className="text-gray-400 flex-shrink-0" />
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="prenom.nom@djezzy.dz"
                className="flex-1 bg-transparent py-3 text-sm text-gray-800 outline-none placeholder-gray-300"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Mot de passe
            </label>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 focus-within:border-red-400 focus-within:bg-white transition-all">
              <Lock size={17} className="text-gray-400 flex-shrink-0" />
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent py-3 text-sm text-gray-800 outline-none placeholder-gray-300"
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-[#E31D2B] hover:bg-red-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 text-base"
          >
            <LogIn size={18} />
            {loading ? "Vérification..." : "Se connecter"}
          </button>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400">
          
          <span>Besoin d'aide ?</span>
          <a
            href="mailto:serviceIT_Help@djezzy.dz"
            className="text-[#E31D2B] font-semibold hover:underline"
          >
            Contacter le service technique
          </a>
        </div>

      </div>
    </div>
  );
}