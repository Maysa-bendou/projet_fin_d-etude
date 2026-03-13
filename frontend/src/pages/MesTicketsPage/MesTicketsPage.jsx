export default function MesTicketsPage() {
  // placeholder data
  const tickets = [
    { id: 1, title: "Problème de connexion", status: "Ouvert" },
    { id: 2, title: "Erreur application", status: "En cours" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mes Tickets</h1>
      <ul className="space-y-2">
        {tickets.map((t) => (
          <li key={t.id} className="border p-2 rounded hover:bg-gray-100">
            <strong>{t.title}</strong> - {t.status}
          </li>
        ))}
      </ul>
    </div>
  );
}