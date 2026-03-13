import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    localStorage.setItem("role", "employee"); 
    navigate("/app");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-6">Connexion</h1>
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Se connecter
      </button>
    </div>
  );
}