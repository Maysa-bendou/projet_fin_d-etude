import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Import des images avec le bon chemin
import djezzyFutureImg from "../../assets/images/djezzy_future_vr.png";
import djezzyLogoImg from "../../assets/images/Logo_Djezzy.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false); 
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans antialiased">
      {/* Container Principal */}
      <motion.div 
        className="relative w-full max-w-5xl h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        
        {/* SECTION IMAGE (Se réduit au survol) */}
        <motion.div 
          className="relative h-full flex flex-col justify-end p-10 text-white overflow-hidden"
          animate={{ width: isHovered ? "50%" : "100%" }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          {/* Fond d'écran : Le visage de la femme sera plus visible */}
          <div 
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ backgroundImage: `url(${djezzyFutureImg})` }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
          </div>

          {/* LE TEXTE DE BIENVENUE : Ajusté pour être plus discret et plus bas */}
          <div className="z-10 relative bg-black/30 backdrop-blur-md p-6 rounded-2xl max-w-lg mt-auto self-start">
            {/* J'ai rétréci le texte ici (text-2xl au lieu de text-4xl) */}
            <h1 className="text-2xl font-bold mb-3 leading-snug tracking-tight">Le futur est maintenant.</h1>
            {/* J'ai rétréci la description ici (text-base au lieu de text-lg) */}
            <p className="text-base opacity-90 leading-relaxed max-w-sm">Connectez-vous à votre espace sécurisé.</p>
          </div>
        </motion.div>

        {/* SECTION FORMULAIRE (Le fond est déjà blanc par défaut, rien à faire) */}
        <div className="w-1/2 h-full p-12 flex flex-col justify-center">
          <div className="mb-8">
            <img src={djezzyLogoImg} alt="Djezzy Logo" className="h-35 w-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Connexion</h2>
            <p className="text-gray-500">Accès réservé au personnel Djezzy</p>
          </div>

          {error && <p className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border-l-4 border-red-500 font-medium">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700">Email professionnel</label>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all focus:bg-white"
                placeholder="prenom.nom@djezzy.dz"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Mot de passe</label>
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all focus:bg-white"
                placeholder="••••••••"
              />
            </div>
            <button 
              disabled={loading}
              className="w-full mt-4 bg-[#E31D2B] hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 text-lg tracking-wide"
            >
              {loading ? "Vérification..." : "Se connecter"}
            </button>
          </form>
        </div>

      </motion.div>
    </div>
  );
}