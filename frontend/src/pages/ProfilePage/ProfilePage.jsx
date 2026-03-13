export default function ProfilePage() {
  const role = localStorage.getItem("role");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Profil</h1>
      <p>Rôle: {role}</p>
      <p>Nom: John Doe</p>
      <p>Email: john.doe@example.com</p>
    </div>
  );
}