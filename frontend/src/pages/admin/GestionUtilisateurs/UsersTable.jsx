import { useTranslation } from "react-i18next";

// Role → circle color
const ROLE_AVATAR = {
  employee:     { bg: "#fce7f3", color: "#9d174d" },
  technician:   { bg: "#dbeafe", color: "#1d4ed8" },
  chef_service: { bg: "#dcfce7", color: "#16a34a" },
  manager:      { bg: "#f3f4f6", color: "#374151" },
  admin:        { color: "#c2410c", bg: "#fff7ed"},
};

const ROLE_PILL = {
  employee:     {bg: "#fce7f3", color: "#9d174d", border: "#fecaca" },
  technician:   {  bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  chef_service: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  manager:      { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" },
  admin:        { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
};

function UsersTable({ users = [], onRowClick }) {
  const { t } = useTranslation("admin");

  if (!users.length) return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e2d9", padding: "48px 24px", textAlign: "center" }}>
      <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>{t("users.table.emptyTitle")}</p>
      <p style={{ color: "#c4bfb8", fontSize: 12, margin: "4px 0 0" }}>{t("users.table.emptySubtitle")}</p>
    </div>
  );

  const COLS = [
    { key: "id",            label: t("users.table.id"),           w: 55  },
    { key: "collaborator",  label: t("users.table.collaborator"), w: 200 },
    { key: "role",          label: t("users.table.role"),         w: 130 },
    { key: "department",    label: t("users.table.department"),   w: 150 },
    { key: "createdAt",     label: t("users.table.createdAt"),    w: 110 },
    { key: "status",        label: t("users.table.status"),       w: 100 },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e2d9", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>{COLS.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
          <thead>
            <tr style={{ background: "#faf9f7", borderBottom: "1.5px solid #e8e2d9" }}>
              {COLS.map((c, i) => (
                <th key={i} style={{ padding: "9px 10px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", textAlign: "left" }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => {
              const av   = ROLE_AVATAR[u.role] || { bg: "#f3f4f6", color: "#374151" };
              const pill = ROLE_PILL[u.role]   || { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" };
              const isLast = idx === users.length - 1;
              return (
                <tr
                  key={u.id}
                  onClick={() => onRowClick(u)}
                  style={{ background: "#fff", borderBottom: isLast ? "none" : "1px solid #f4f0ec", cursor: "pointer" }}
                  onMouseOver={e => e.currentTarget.style.background = "#faf8f5"}
                  onMouseOut={e  => e.currentTarget.style.background = "#fff"}
                >
                  {/* ID */}
                  <td style={{ padding: "9px 10px", fontSize: 11, fontWeight: 700, color: "#c4bfb8" }}>#{u.id}</td>

                  {/* Collaborator */}
                  <td style={{ padding: "9px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: av.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 900, color: av.color }}>
                          {(u.surname?.[0] || "").toUpperCase()}{(u.name?.[0] || "").toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                          {u.surname} {u.name}
                        </p>
                        <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, fontWeight: 500 }}>
                          {t("users.table.verifiedMember")}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: "9px 10px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, color: pill.color, background: pill.bg, border: `1px solid ${pill.border}` }}>
                      {t(`users.roles.${u.role}`) || u.role}
                    </span>
                  </td>

                  {/* Department */}
                  <td style={{ padding: "9px 10px", fontSize: 12, color: "#64748b", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.department || <span style={{ color: "#d1d5db" }}>—</span>}
                  </td>

                  {/* Created */}
                  <td style={{ padding: "9px 10px", fontSize: 11, color: "#94a3b8" }}>
                    {new Date(u.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>

                  {/* Status */}
                  <td style={{ padding: "9px 10px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px",
                      borderRadius: 99, fontSize: 11, fontWeight: 700,
                      color:      u.is_active ? "#16a34a" : "#dc2626",
                      background: u.is_active ? "#f0fdf4" : "#fef2f2",
                      border:     `1px solid ${u.is_active ? "#bbf7d0" : "#fecaca"}`,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: u.is_active ? "#16a34a" : "#dc2626" }} />
                      {u.is_active ? t("users.table.active") : t("users.table.inactive")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersTable;