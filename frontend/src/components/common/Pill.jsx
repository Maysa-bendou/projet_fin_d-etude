export default function Pill({ config, value, label, size = "md" }) {
  const s = config?.[value];
  if (!s) return <span style={{ color: "#d1d5db" }}>—</span>;

  const padding = size === "sm" ? "1px 8px" : "3px 10px";
  const fontSize = size === "sm" ? 11 : 12;

  return (
    <span style={{
      background:   s.bg,
      color:        s.color,
      border:       `1px solid ${s.border}`,
      borderRadius: 20,
      padding,
      fontSize,
      fontWeight:   600,
      whiteSpace:   "nowrap",
      display:      "inline-block",
    }}>
      {/* 🔥 USE TRANSLATED LABEL if provided */}
      {label || s.label}
    </span>
  );
}
