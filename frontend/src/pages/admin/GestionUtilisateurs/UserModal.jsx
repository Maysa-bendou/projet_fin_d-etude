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

  const [isEditing, setIsEditing] = useState(mode === "add");

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

  // Style des champs : blanc pur sur fond beige, texte Slate
  const inputStyle = "w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all disabled:bg-gray-100/50 disabled:text-gray-400";

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      {/* Fond du modal en Beige  */}
      <div className="bg-[#fefdfd] border border-gray-300 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transition-all">
        
        {/* Header simplifié */}
        <div className="px-6 py-5 border-b border-gray-200 bg-white/50">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {mode === "add" ? "Ajouter utilisateur" : "Détails utilisateur"}
          </h2>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" name="surname" value={form.surname} onChange={handleChange} placeholder="Prénom" className={inputStyle} disabled={!isEditing} />
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Nom" className={inputStyle} disabled={!isEditing} />
          </div>
          
          <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" className={inputStyle} disabled={!isEditing} />
          
          <div className="grid grid-cols-2 gap-3">
            <select name="role" value={form.role} onChange={handleChange} className={inputStyle} disabled={!isEditing}>
              <option value="employee">Employé</option>
              <option value="technician">Technicien</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="Téléphone" className={inputStyle} disabled={!isEditing} />
          </div>

          <select name="department" value={form.department} onChange={handleChange} className={inputStyle} disabled={!isEditing}>
            <option value="">Sélectionner un département</option>
            {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input type="text" name="job_title" value={form.job_title} onChange={handleChange} placeholder="Poste" className={inputStyle} disabled={!isEditing} />
            <input type="text" name="block_number" value={form.block_number} onChange={handleChange} placeholder="Bloc" className={inputStyle} disabled={!isEditing} />
          </div>

          {isEditing && (
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Mot de passe" className={inputStyle} />
          )}

          {isServiceRequired && (
            <select name="service_id" value={form.service_id} onChange={handleChange} className={inputStyle} disabled={!isEditing}>
              <option value="">Sélectionner un service</option>
              {services.map((s) => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
            </select>
          )}
        </div>

        {/* Footer avec les boutons style "Rouge" et "Slate" */}
        <div className="px-6 py-4 bg-white/30 border-t border-gray-200 flex justify-end gap-3">
          <button 
            onClick={() => setUser(null)} 
            className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
          >
            Fermer
          </button>

          {isEditing ? (
            <button 
              onClick={handleSubmit} 
              className="px-6 py-2.5 bg-[#e53935] text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#d32f2f] shadow-md transition-all active:scale-95"
            >
              Sauvegarder
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="px-6 py-2.5 bg-slate-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-900 shadow-md transition-all active:scale-95"
            >
              Modifier
            </button>
          )}

          {mode === "edit" && toggleActive && (
            <button
              onClick={() => toggleActive(user.id)}
              className={`px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-sm transition-all border ${
                user.is_active 
                ? "border-red-200 text-red-600 hover:bg-red-50" 
                : "border-green-200 text-green-600 hover:bg-green-50"
              }`}
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