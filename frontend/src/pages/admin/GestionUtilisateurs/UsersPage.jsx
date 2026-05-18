import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineArrowPath,
  HiOutlineUserPlus, HiOutlineCheckCircle, HiOutlineFunnel,
} from "react-icons/hi2";
import RefreshButton from "../../../components/common/RefreshButton";
import UsersTable from "./UsersTable";
import UserModal from "./UserModal";

// ── Filter primitives (same as ticket service) ─────────────────────────────
const FilterInput = ({ placeholder, value, onChange }) => (
  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
    <HiOutlineMagnifyingGlass size={13} color="#94a3b8" style={{ position: "absolute", left: 9, pointerEvents: "none" }} />
    <input
      type="text" placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete="off" 
      style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: "0 26px 0 28px", height: 32, width: 200, fontSize: 12, color: "#1e293b", background: "#fff", outline: "none" }}
      onFocus={e => e.target.style.borderColor = "#93c5fd"}
      onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
    />
    {value && (
      <button onClick={() => onChange("")} style={{ position: "absolute", right: 7, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
        <HiOutlineXMark size={12} color="#94a3b8" />
      </button>
    )}
  </div>
);

const FilterSelect = ({ value, onChange, minW = 115, children }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    border: "1px solid #e2e8f0", borderRadius: 7, padding: "0 10px",
    height: 32, fontSize: 12, color: value ? "#1e293b" : "#94a3b8",
    background: "#fff", outline: "none", cursor: "pointer", appearance: "none", minWidth: minW,
  }}>
    {children}
  </select>
);

const Sep = () => <div style={{ width: 1, height: 20, background: "#e8e2d9", flexShrink: 0 }} />;

// ── Success toast ──────────────────────────────────────────────────────────
const SuccessCard = ({ message, onClose, t }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(15,23,42,0.3)",
    backdropFilter: "blur(2px)", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 9999, padding: 24,
  }}>
    <div style={{
      background: "#fff", borderRadius: 20, border: "1px solid #d9d4cc",
      padding: "40px 36px", maxWidth: 400, width: "100%", textAlign: "center",
      boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    }}>
      {/* Icon */}
      <div style={{
        width: 56, height: 56, background: "#f0fdf4", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px", fontSize: 22, color: "#16a34a",
        border: "2px solid #bbf7d0",
      }}>✓</div>

      {/* Title */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
        {t("departments.title")}
      </h2>

      {/* Message */}
      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 28, margin: "0 0 28px" }}>
        {message}
      </p>

      {/* Button */}
      <button onClick={onClose} style={{
        width: "100%", background: "#1e3a8a", color: "#fff", border: "none",
        borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600,
        cursor: "pointer",
      }}>
        {t("departments.done")}
      </button>
    </div>
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────────
function UsersPage() {
  const { t } = useTranslation(["admin", "common"]); // common used for: loading, refresh.label

  const [users,          setUsers]          = useState([]);
  const [selectedUser,   setSelectedUser]   = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [services,       setServices]       = useState([]);
  const [successMsg,     setSuccessMsg]     = useState("");

  const [searchTerm,   setSearchTerm]   = useState("");
  const [filterRole,   setFilterRole]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, sRes, dRes] = await Promise.all([
        fetch("http://localhost:3001/api/users"),
        fetch("http://localhost:3001/api/users/services"),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (sRes.ok) setServices(await sRes.json());
    } catch { setError(t("users.loadError")); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const addUser = async (newUser) => {
    const res = await fetch("http://localhost:3001/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || `HTTP ${res.status}`);
    }
    const created = await res.json();
    setUsers(prev => [created, ...prev]);
    setIsAddModalOpen(false);
    showSuccess(t("users.modal.titleAdd") + " ✓");
  };

  const updateUser = async (updatedUser) => {
    const res = await fetch(`http://localhost:3001/api/users/${updatedUser.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || `HTTP ${res.status}`);
    }
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setSelectedUser(null);
    showSuccess(t("users.modal.titleEdit") + " ✓");
  };

  const toggleActive = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${id}/toggle-active`, { method: "PUT" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
      setSelectedUser(null);
      showSuccess(t("users.statusUpdated"));
    } catch (err) { setError(err.message); }
  };

  const ROLES = ["employee", "technician", "director", "manager", "admin"];

  const filteredUsers = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return users.filter(u => {
      const nameMatch = `${u.surname} ${u.name}`.toLowerCase().includes(s) || String(u.id).includes(s);
      const roleMatch = !filterRole   || u.role === filterRole;
      const statMatch = !filterStatus || (filterStatus === "active" ? u.is_active : !u.is_active);
      return nameMatch && roleMatch && statMatch;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  const hasFilters = searchTerm || filterRole || filterStatus;
  const resetFilters = () => { setSearchTerm(""); setFilterRole(""); setFilterStatus(""); };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f9f6f2" }}>
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div className="w-9 h-9 border-4 border-slate-200 border-t-red-700 rounded-full animate-spin" />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 2 }}>
          {t("common:loading")}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #e8e2d9", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("users.pageTitle")}</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0, fontWeight: 500 }}>
            {t("users.pageSubtitle")}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RefreshButton onRefresh={fetchData} />
          <button
             onClick={() => {
    setSelectedUser(null); // ← clear any previous selection
    setIsAddModalOpen(true);
  }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            <HiOutlineUserPlus size={15} />
            {t("users.addButton")}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 28px" }}>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, background: "#fff", border: "1px solid #e8e2d9", borderRadius: 10, padding: "7px 12px", overflowX: "auto" }}>
          <HiOutlineFunnel size={14} color="#c4bfb8" style={{ flexShrink: 0 }} />
          <Sep />
          <FilterInput placeholder={t("users.searchPlaceholder")} value={searchTerm} onChange={setSearchTerm} />
          <Sep />
          <FilterSelect value={filterRole} onChange={setFilterRole} minW={120}>
            <option value="">{t("users.allRoles")}</option>
            {ROLES.map(r => <option key={r} value={r}>{t(`users.roles.${r}`) || r}</option>)}
          </FilterSelect>
          <FilterSelect value={filterStatus} onChange={setFilterStatus} minW={100}>
            <option value="">{t("users.allStatuses")}</option>
            <option value="active">{t("users.table.active")}</option>
            <option value="inactive">{t("users.table.inactive")}</option>
          </FilterSelect>
          <Sep />
          <button onClick={resetFilters} style={{
            display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 11px", borderRadius: 7, whiteSpace: "nowrap",
            border: `1px solid ${hasFilters ? "#fca5a5" : "#e2e8f0"}`,
            fontSize: 12, fontWeight: 600,
            color: hasFilters ? "#dc2626" : "#94a3b8",
            background: hasFilters ? "#fef2f2" : "#fff", cursor: "pointer", flexShrink: 0,
          }}>
            <HiOutlineArrowPath size={12} />
            {t("common:refresh.label")}
          </button>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>{filteredUsers.length}</span>
            {filteredUsers.length !== users.length && <> / {users.length}</>} {t("users.accountsLabel")}
          </span>
        </div>

        {/* Table */}
        <UsersTable users={filteredUsers} onRowClick={setSelectedUser} />
      </div>

{isAddModalOpen && (
  <UserModal key="add" services={services}
    setUser={setIsAddModalOpen} saveUser={addUser} mode="add" />
)}
{selectedUser && (
  <UserModal key={selectedUser.id} services={services}
    user={selectedUser} setUser={setSelectedUser}
    saveUser={updateUser} toggleActive={toggleActive} mode="edit" />
)}

      {/* Success toast */}
      {successMsg && <SuccessCard message={successMsg} onClose={() => setSuccessMsg("")} t={t} />}
    </div>
  );
}

export default UsersPage;