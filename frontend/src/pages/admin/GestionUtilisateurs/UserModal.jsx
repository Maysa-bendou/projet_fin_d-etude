import { useState } from "react";

function UserModal({ user = {}, setUser, saveUser, toggleActive, mode, services = [], departments = [] }) {
  const [form, setForm] = useState({
    surname: user.surname || "",
    name: user.name || "",
    email: user.email || "",
    role: user.role || "employee",
    department: user.department || "",
    phone: user.phone || "",
    job_title: user.job_title || "",
    block_number: user.block_number || "",
    service_id: user.service_id ? user.service_id.toString() : "",
    password: "",
  });

  const [isEditing, setIsEditing] = useState(mode === "add"); // si mode add, déjà éditable

  const isServiceRequired = ["technician", "manager"].includes(form.role);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (isServiceRequired && !form.service_id) {
      alert("Le service est obligatoire pour ce rôle.");
      return;
    }
    if (mode === "add" && !form.password.trim()) {
      alert("Le mot de passe est requis pour ajouter un utilisateur.");
      return;
    }

    const submitData = { ...user, ...form };
    if (mode === "add") submitData.password = form.password;
    submitData.service_id = form.service_id ? parseInt(form.service_id, 10) : null;

    saveUser(submitData);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full space-y-3">
        <h2 className="text-xl font-bold">{mode === "add" ? "Ajouter utilisateur" : "Détails utilisateur"}</h2>

        <input type="text" name="surname" value={form.surname} onChange={handleChange} placeholder="Prénom" className="input-field" disabled={!isEditing} />
        <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Nom" className="input-field" disabled={!isEditing} />
        <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" className="input-field" disabled={!isEditing} />
        <select name="role" value={form.role} onChange={handleChange} className="input-field" disabled={!isEditing}>
          <option value="employee">Employé</option>
          <option value="technician">Technicien</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <select name="department" value={form.department} onChange={handleChange} className="input-field" disabled={!isEditing}>
          <option value="">Sélectionner un département</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
        <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="Téléphone" className="input-field" disabled={!isEditing} />
        <input type="text" name="job_title" value={form.job_title} onChange={handleChange} placeholder="Poste" className="input-field" disabled={!isEditing} />
        <input type="text" name="block_number" value={form.block_number} onChange={handleChange} placeholder="Bloc" className="input-field" disabled={!isEditing} />
        {isEditing && (
          <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Nouveau mot de passe (optionnel)" className="input-field" />
        )}
        {isServiceRequired && (
          <select name="service_id" value={form.service_id} onChange={handleChange} className="input-field" disabled={!isEditing}>
            <option value="">Sélectionner un service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id.toString()}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <button onClick={() => setUser(null)} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">
            Fermer
          </button>
          {!isEditing && mode === "edit" && (
            <button onClick={() => setIsEditing(true)} className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600">
              Modifier
            </button>
          )}
          {isEditing && (
            <button onClick={handleSubmit} className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">
              Sauvegarder
            </button>
          )}
          {mode === "edit" && toggleActive && (
            <button
              onClick={() => toggleActive(user.id)}
              className={`px-3 py-1 rounded ${user.is_active ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"} text-white`}
            >
              {user.is_active ? "Désactiver" : "Activer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserModal;
