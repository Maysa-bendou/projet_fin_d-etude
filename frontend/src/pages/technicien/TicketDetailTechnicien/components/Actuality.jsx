import { Activity } from "lucide-react";
import { ACT_DOT } from "./constants";

export default function Actuality({ actuality }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Activity size={12}/> Actualité
        </h2>
      </div>
      <div className="h-[200px] overflow-hidden p-4">
        {actuality.length === 0 ? (
          <p className="text-[11px] text-gray-300 text-center mt-8">Aucune activité</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 h-full">
            {actuality.map(item => (
              <div key={item.id} className="flex-none w-48 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition hover:bg-white min-h-[120px] flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${ACT_DOT[item.type] ?? "bg-gray-300"}`}/>
                  <p className="text-[10px] font-bold text-gray-400 font-mono flex-shrink-0">{item.date}</p>
                </div>
                <p 
                  className="text-[11px] text-gray-700 leading-snug flex-1 line-clamp-4"
                  dangerouslySetInnerHTML={{ __html: item.message }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}