import { useState } from "react";

export default function CreateTicketPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Ticket créé:\nTitre: ${title}\nDescription: ${description}`);
    setTitle("");
    setDescription("");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Créer un nouveau ticket</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <input
          type="text"
          placeholder="Titre du ticket"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Créer
        </button>
      </form>
    </div>
  );
}