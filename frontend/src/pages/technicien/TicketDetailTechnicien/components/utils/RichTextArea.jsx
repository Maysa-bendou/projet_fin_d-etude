import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, RotateCcw } from "lucide-react";

export default function RichTextArea({ onChange, placeholder, rows = 6, disabled = false, clearSignal }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) { ref.current.innerHTML = ""; onChange(""); }
  }, [clearSignal]);

  const exec = (cmd) => { 
    ref.current?.focus(); 
    document.execCommand(cmd, false, null); 
    onChange(ref.current?.innerHTML || ""); 
  };

  const tools = [
    { Icon:Bold, cmd:"bold" }, { Icon:Italic, cmd:"italic" },
    { Icon:Underline, cmd:"underline" }, { Icon:Strikethrough, cmd:"strikeThrough" },
    { divider:true },
    { Icon:List, cmd:"insertUnorderedList" }, { Icon:ListOrdered, cmd:"insertOrderedList" },
    { divider:true }, { Icon:RotateCcw, cmd:"removeFormat" },
  ];

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-100 flex-wrap">
        {tools.map((t, i) => t.divider
          ? <div key={i} className="w-px h-4 bg-gray-300 mx-1"/>
          : <button key={i} type="button" onMouseDown={e => { e.preventDefault(); exec(t.cmd); }}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 transition text-gray-600 bg-transparent border-none cursor-pointer">
              <t.Icon size={13}/>
            </button>
        )}
      </div>
      <div ref={ref} contentEditable={!disabled} suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || "")}
        data-placeholder={placeholder}
        className="px-3 py-2.5 text-[13px] text-gray-800 outline-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        style={{ minHeight:`${rows * 22}px` }}/>
    </div>
  );
}

