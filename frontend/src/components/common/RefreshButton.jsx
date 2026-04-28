import { useState } from "react";
import { HiOutlineArrowPath } from "react-icons/hi2";

export default function RefreshButton({ onRefresh, label = "Actualiser" }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-500
                 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 hover:text-gray-700
                 transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
    >
      <HiOutlineArrowPath
        size={14}
        className={loading ? "animate-spin" : ""}
      />
      {loading ? "Actualisation…" : label}
    </button>
  );
}