import { MdNotifications } from "react-icons/md";
import { FaSearch } from "react-icons/fa";

export default function Navbar() {
  return (
    <div className="
      flex items-center justify-end
      gap-4 px-6 py-3
      bg-white border-b border-gray-100
      shadow-sm h-16 shrink-0
    ">

      {/* Barre de recherche */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 w-64">
        <FaSearch size={14} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-sm text-gray-600 outline-none w-full"
        />
      </div>

      {/* Cloche notification */}
      <div className="relative cursor-pointer">
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
          <MdNotifications size={20} className="text-purple-500" />
        </div>
        {/* Badge nombre notifications */}
        <span className="
          absolute -top-1 -right-1
          w-4 h-4 bg-red-500 text-white
          text-xs rounded-full
          flex items-center justify-center
          font-bold
        ">
          3
        </span>
      </div>

      {/* Photo utilisateur */}
      <div className="
        w-9 h-9 rounded-full
        bg-gradient-to-br from-blue-500 to-purple-600
        flex items-center justify-center
        cursor-pointer
        hover:opacity-80 transition
      ">
        <span className="text-white text-xs font-bold">AH</span>
      </div>

    </div>
  );
}