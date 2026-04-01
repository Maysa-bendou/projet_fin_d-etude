import { useState } from "react";

export default function RefreshButton({ onRefresh, label = "Actualiser" }) {
  const [spinning, setSpinning] = useState(false);

  async function handleClick() {
    setSpinning(true);
    await onRefresh();
    setTimeout(() => setSpinning(false), 600);
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-500
                 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
    >
      <span
        className="inline-block transition-transform duration-500"
        style={{ transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}
      >
        ↻
      </span>
      {label}
    </button>
  );
}