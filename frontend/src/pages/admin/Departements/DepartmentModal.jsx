import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineXMark } from "react-icons/hi2";

function DepartmentModal({ department, setDepartment, setDepartments, departments, showSuccess }) {
  const { t } = useTranslation('admin');

  const isEdit = department.id !== undefined;

  const [name,        setName]        = useState(department.name        || "");
  const [description, setDescription] = useState(department.description || "");
  const [loading,     setLoading]     = useState(false);
  const [missing,     setMissing]     = useState([]);
  const [serverError, setServerError] = useState("");

  const inputStyle = (key) => ({
    width: "100%", borderRadius: 8, padding: "8px 12px", fontSize: 13,
    fontWeight: 500, color: "#1e293b", background: "#fff", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
    border: missing.includes(key) ? "1.5px solid #dc2626" : "1.5px solid #e2e8f0",
  });

  const labelStyle = (key) => ({
    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.3px", display: "block", marginBottom: 5,
    color: missing.includes(key) ? "#dc2626" : "#64748b",
  });

  const handleSubmit = async () => {
    // ── validation ──
    const missingKeys = [];
    if (!name.trim()) missingKeys.push("name");
    if (missingKeys.length > 0) { setMissing(missingKeys); return; }

    setMissing([]);
    setServerError("");

    const token = localStorage.getItem("token");
    if (!token) { setServerError(t('departments.modal.notConnected')); return; }

    setLoading(true);
    try {
      const url    = isEdit ? `http://localhost:3001/api/departments/${department.id}` : "http://localhost:3001/api/departments";
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        const msg = e.error || `HTTP ${res.status}`;
        if (msg.toLowerCase().includes("name") || msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
          setServerError(t('departments.modal.nameExists') || "A department with this name already exists.");
        } else {
          setServerError(msg);
        }
        return;
      }

      const data = await res.json();
      if (isEdit) {
        setDepartments(departments.map(d => d.id === data.id ? data : d));
      } else {
        setDepartments([data, ...departments]);
      }
      showSuccess?.(isEdit ? t('departments.modal.titleEdit') + " ✓" : t('departments.modal.titleAdd') + " ✓");
      setDepartment(null);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('departments.modal.confirmDelete'))) return;
    const token = localStorage.getItem("token");
    if (!token) { setServerError(t('departments.modal.notConnectedDelete')); return; }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/departments/${department.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDepartments(departments.filter(d => d.id !== department.id));
      showSuccess?.(t('departments.modal.delete') + " ✓");
      setDepartment(null);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#1d4ed8" }}>
                {(name?.[0] || "D").toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              {isEdit ? t('departments.modal.titleEdit') : t('departments.modal.titleAdd')}
            </h2>
          </div>
          <button onClick={() => setDepartment(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}>
            <HiOutlineXMark size={18} color="#94a3b8" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Error banner */}
          {(serverError || missing.length > 0) && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "11px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>⚠</span>
              <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 500 }}>
                {serverError && <div style={{ marginBottom: missing.length > 0 ? 4 : 0 }}>{serverError}</div>}
                {missing.length > 0 && (
                  <div>
                    {t('departments.modal.nameRequired') || "Please fill in all required fields"}:&nbsp;
                    <strong>{missing.join(", ")}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle("name")}>
              {t('departments.modal.nameLabel')}
              {missing.includes("name") && (
                <span style={{ marginLeft: 6, fontWeight: 500, textTransform: "none", fontSize: 10 }}>
                  — {t('departments.modal.required') || "required"}
                </span>
              )}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setMissing([]); setServerError(""); }}
              disabled={loading}
              style={inputStyle("name")}
            />
          </div>

          <div>
            <label style={labelStyle("description")}>{t('departments.modal.descriptionLabel')}</label>
            <textarea
              rows="4"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={loading}
              style={{ ...inputStyle("description"), resize: "none" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa" }}>
          <button onClick={() => setDepartment(null)} style={{ padding: "8px 16px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#64748b", background: "#fff", cursor: "pointer" }}>
            {t('departments.modal.cancel')}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {isEdit && (
              <button onClick={handleDelete} disabled={loading} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1.5px solid #fecaca", color: "#dc2626", background: "#fef2f2" }}>
                {t('departments.modal.delete')}
              </button>
            )}
            <button onClick={handleSubmit} disabled={loading || !name.trim()} style={{ padding: "8px 20px", background: loading ? "#94a3b8" : "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? t('departments.modal.saving') : isEdit ? t('departments.modal.edit') : t('departments.modal.create')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DepartmentModal;