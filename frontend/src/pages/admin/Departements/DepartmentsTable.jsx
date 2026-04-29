import { useTranslation } from "react-i18next";

function DepartmentsTable({ departments = [], onRowClick }) {
  const { t } = useTranslation('admin');

  if (!departments.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: 12, textAlign: 'center', padding: '48px 24px', fontFamily: 'sans-serif' }}>
        <div style={{ width: 40, height: 40, background: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 18 }}>🏢</div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          {t('departments.empty.title')}
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
          {t('departments.empty.subtitle')}
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: 12, overflow: "hidden", fontFamily: "sans-serif" }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>

          <thead>
            <tr style={{ background: '#faf9f7', borderBottom: '1px solid #e8e4de' }}>
              {[
                t('departments.table.id'),
                t('departments.table.name'),
                t('departments.table.description'),
                t('departments.table.createdAt'),
              ].map((col, i) => (
                <th key={i} style={{ padding: "9px 10px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", textAlign: "left" }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {departments.map((d, idx) => (
              <tr
                key={d.id}
                onClick={() => onRowClick(d)}
                style={{ borderBottom: idx < departments.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer', background: '#fff', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                {/* ID */}
                <td style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>
                  #{d.id}
                </td>

                {/* Name with avatar */}
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 50, flexShrink: 0, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>
                      {d.name[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{d.name}</span>
                  </div>
                </td>

                {/* Description */}
                <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280', maxWidth: 300 }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.description || '—'}
                  </span>
                </td>

                {/* Date */}
                <td style={{ padding: '14px 20px', fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
                  {new Date(d.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DepartmentsTable;