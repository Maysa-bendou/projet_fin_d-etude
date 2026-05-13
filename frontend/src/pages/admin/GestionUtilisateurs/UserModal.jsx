import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineXMark } from "react-icons/hi2";

const ROLE_AVATAR = {
  employee:     { bg: "#fce7f3", color: "#9d174d", border: "#fecaca" },
  technician:   { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  chef_service: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  manager:      { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" },
  admin:        { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
};

const REQUIRED_FIELDS = ["surname", "name", "email", "role"];

function UserModal({ user = {}, setUser, saveUser, toggleActive, mode, services = [], departments = [] }) {
  const { t } = useTranslation("admin");

  const [form, setForm] = useState({
    surname:      user.surname      || "",
    name:         user.name         || "",
    email:        user.email        || "",
    role:         user.role         || "employee",
    department:   user.department   || "",
    phone:        user.phone        || "",
    job_title:    user.job_title    || "",
    block_number: user.block_number || "",
    service_id:   user.service_id ? user.service_id.toString() : "",
    password:     "",
  });

  const [isEditing, setIsEditing]   = useState(mode === "add");
  const [missing,   setMissing]     = useState([]);
  const [serverError, setServerError] = useState("");

  const isServiceRequired = ["technician", "manager"].includes(form.role);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMissing(prev => prev.filter(k => k !== e.target.name));
    setServerError("");
  };

  const handleSubmit = async () => {
    // ── client-side validation ──────────────────────────────
    const requiredKeys = [...REQUIRED_FIELDS];
    if (mode === "add") requiredKeys.push("password");
    if (isServiceRequired) requiredKeys.push("service_id");

    const missingKeys = requiredKeys.filter(k => !form[k]?.toString().trim());
    if (missingKeys.length > 0) {
      setMissing(missingKeys);
      return;
    }

    setMissing([]);
    setServerError("");

    // ── submit ──────────────────────────────────────────────
    const submitData = { ...user, ...form };
    if (mode === "add") submitData.password = form.password;
    submitData.service_id = form.service_id ? parseInt(form.service_id, 10) : null;

    try {
      await saveUser(submitData);          // saveUser should throw on error
    } catch (err) {
      // detect duplicate email
      const msg = err.message || "";
      if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
        setServerError(t("users.modal.emailExists"));
      } else {
        setServerError(msg || t("users.modal.unexpectedError"));
      }
    }

    setIsEditing(false);
  };

  const av = ROLE_AVATAR[form.role] || { bg: "#f3f4f6", color: "#374151" };

  const borderFor = (key) =>
    missing.includes(key) ? "1.5px solid #dc2626" : "1.5px solid #e2e8f0";

  const inputStyle = (key) => ({
    width: "100%", border: borderFor(key), borderRadius: 8,
    padding: "8px 12px", fontSize: 13, fontWeight: 500, color: "#1e293b",
    background: isEditing ? "#fff" : "#f9f6f2", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
  });

  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px", display: "block", marginBottom: 5 };
  const missingLabelStyle = { ...labelStyle, color: "#dc2626" };

  const Label = ({ fieldKey, children }) => (
    <label style={missing.includes(fieldKey) ? missingLabelStyle : labelStyle}>
      {children}
      {missing.includes(fieldKey) && (
        <span style={{ marginLeft: 6, fontWeight: 500, textTransform: "none", fontSize: 10 }}>
          — {t("users.modal.required")}
        </span>
      )}
    </label>
  );

  const ROLES = ["employee", "technician", "chef_service", "manager", "admin"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: av.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: av.color }}>
                {(form.surname?.[0] || "U").toUpperCase()}{(form.name?.[0] || "").toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              {mode === "add" ? t("users.modal.titleAdd") : t("users.modal.titleEdit")}
            </h2>
          </div>
          <button onClick={() => setUser(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}>
            <HiOutlineXMark size={18} color="#94a3b8" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", maxHeight: "65vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── Error banner ── */}
          {(serverError || missing.length > 0) && (
            <div style={{
              background: "#faf9f7", border: "1px solid #fecaca", borderRadius: 10,
              padding: "11px 14px", display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>⚠</span>
              <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 500 }}>
                {serverError && <div style={{ marginBottom: missing.length > 0 ? 4 : 0 }}>{serverError}</div>}
                {missing.length > 0 && (
                  <div>
                    {t("users.modal.missingFields")}:&nbsp;
                    <strong>{missing.join(", ")}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <Label fieldKey="surname">{t("users.modal.surname")}</Label>
              <input name="surname" value={form.surname} onChange={handleChange} style={inputStyle("surname")} disabled={!isEditing} />
            </div>
            <div>
              <Label fieldKey="name">{t("users.modal.name")}</Label>
              <input name="name" value={form.name} onChange={handleChange} style={inputStyle("name")} disabled={!isEditing} />
            </div>
          </div>

          <div>
            <Label fieldKey="email">{t("users.modal.email")}</Label>
            <input name="email" type="email" value={form.email} onChange={handleChange} style={inputStyle("email")} disabled={!isEditing}
            autoComplete="off"  />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <Label fieldKey="role">{t("users.modal.role")}</Label>
              <select name="role" value={form.role} onChange={handleChange}
                style={{ ...inputStyle("role"), cursor: isEditing ? "pointer" : "default", appearance: "none" }}
                disabled={!isEditing}>
                {ROLES.map(r => <option key={r} value={r}>{t(`users.roles.${r}`)}</option>)}
              </select>
            </div>
            <div>
              <Label fieldKey="phone">{t("users.modal.phone")}</Label>
              <input name="phone" value={form.phone} onChange={handleChange} style={inputStyle("phone")} disabled={!isEditing} />
            </div>
          </div>

          <div>
            <Label fieldKey="department">{t("users.modal.department")}</Label>
            <select name="department" value={form.department} onChange={handleChange}
              style={{ ...inputStyle("department"), cursor: isEditing ? "pointer" : "default", appearance: "none" }}
              disabled={!isEditing}>
              <option value="">{t("users.modal.selectDepartment")}</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <Label fieldKey="job_title">{t("users.modal.jobTitle")}</Label>
              <input name="job_title" value={form.job_title} onChange={handleChange} style={inputStyle("job_title")} disabled={!isEditing} />
            </div>
            <div>
              <Label fieldKey="block_number">{t("users.modal.block")}</Label>
              <input name="block_number" value={form.block_number} onChange={handleChange} style={inputStyle("block_number")} disabled={!isEditing} />
            </div>
          </div>

          {isEditing && (
            <div>
              <Label fieldKey="password">{t("users.modal.password")}</Label>
              <input name="password" type="password" value={form.password} onChange={handleChange} style={inputStyle("password")} autoComplete="new-password" />
            </div>
          )}

          {isServiceRequired && (
            <div>
              <Label fieldKey="service_id">{t("users.modal.service")}</Label>
              <select name="service_id" value={form.service_id} onChange={handleChange}
                style={{ ...inputStyle("service_id"), cursor: isEditing ? "pointer" : "default", appearance: "none" }}
                disabled={!isEditing}>
                <option value="">{t("users.modal.selectService")}</option>
                {services.map(s => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
              </select>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa" }}>
          <button onClick={() => setUser(null)} style={{ padding: "8px 16px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#64748b", background: "#fff", cursor: "pointer" }}>
            {t("users.modal.close")}
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {mode === "edit" && toggleActive && (
              <button onClick={() => toggleActive(user.id)} style={{
                padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: `1.5px solid ${user.is_active ? "#fecaca" : "#bbf7d0"}`,
                color:      user.is_active ? "#dc2626" : "#16a34a",
                background: user.is_active ? "#fef2f2" : "#f0fdf4",
              }}>
                {user.is_active ? t("users.modal.deactivate") : t("users.modal.activate")}
              </button>
            )}

            {isEditing ? (
              <button onClick={handleSubmit} style={{ padding: "8px 20px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {t("users.modal.save")}
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} style={{ padding: "8px 20px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {t("users.modal.edit")}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default UserModal;