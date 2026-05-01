import {
  Activity, CheckCircle, XCircle, AlertCircle, Clock,
  UserCheck, TrendingUp, CornerUpRight, Calendar, AlignLeft, Star
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ACT_META } from "./constants";

const ICON_MAP = {
  "user-check":      UserCheck,
  "clock":           Clock,
  "alert-circle":    AlertCircle,
  "check-circle":    CheckCircle,
  "x-circle":        XCircle,
  "trending-up":     TrendingUp,
  "corner-up-right": CornerUpRight,
  "calendar":        Calendar,
  "align-left":      AlignLeft,
  "star":            Star,
};

export default function Actuality({ actuality }) {
  const { t } = useTranslation("technicien");

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Activity size={12}/> {t("components.actuality.title")}
        </h2>
      </div>

      <div className="h-[200px] overflow-hidden p-4">
        {actuality.length === 0 ? (
          <p className="text-[11px] text-gray-300 text-center mt-8">
            {t("components.actuality.empty")}
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 h-full">
            {actuality.map(item => {
              const meta = ACT_META[item.type] ?? ACT_META.comment;
              const Icon = ICON_MAP[meta.icon] ?? AlignLeft;
              return (
                <div key={item.id} className="flex-none w-48 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition hover:bg-white min-h-[120px] flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`}/>
                    <Icon size={11} className="text-gray-400 shrink-0"/>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate">
                      {t(meta.labelKey)}
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mb-1.5">{item.date}</p>
<p
  className="text-[11px] text-gray-700 leading-snug flex-1 line-clamp-4"
  dangerouslySetInnerHTML={{ __html: item.messageKey ? t(item.messageKey) : item.message }}
/>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}