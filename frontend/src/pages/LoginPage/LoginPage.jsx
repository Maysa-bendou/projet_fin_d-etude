import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
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

      const roles = {
        admin: "/admin",
        technician: "/technician",
        chef_service: "/chef",
        manager: "/manager"
      };

      navigate(roles[data.user.role] || "/employee");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f6f2] px-4">

      {/* CARD */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg p-8">

        {/* HEADER */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <img src={djezzyLogoImg} alt="Djezzy" className="h-12" />

          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Connexion
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Accédez à votre espace professionnel
            </p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-5">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* EMAIL */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Email professionnel
            </label>

            <div className="mt-1 flex items-center gap-3 px-4 py-2.5 bg-[#f9f6f2] border border-[#e8e4df] rounded-lg focus-within:ring-2 focus-within:ring-red-200">
              <Mail size={16} className="text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@djezzy.dz"
                className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Mot de passe
            </label>

            <div className="mt-1 flex items-center gap-3 px-4 py-2.5 bg-[#f9f6f2] border border-[#e8e4df] rounded-lg focus-within:ring-2 focus-within:ring-red-200">
              <Lock size={16} className="text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-[#b20000c] hover:bg-[#b20000] text-white text-sm font-bold uppercase tracking-widest py-3 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-60"
          >
            <LogIn size={16} />
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Besoin d’aide ?{" "}
          <a
            href="mailto:serviceIT_Help@djezzy.dz"
            className="text-[#e53935] font-semibold hover:underline"
          >
            Contacter le support
          </a>
        </div>

      </div>
    </div>
  );
}