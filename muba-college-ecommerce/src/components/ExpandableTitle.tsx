import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ExpandableTitle({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative flex items-start">
      <h1
        className={`mb-2 text-gray-900 text-lg leading-tight transition-all duration-300 ${
          expanded ? "line-clamp-none" : "line-clamp-2"
        }`}
      >
        {text || "Product Title"}
      </h1>
       {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center text-sm text-[#3bb85e] hover:underline focus:outline-none"
      >
        {expanded ? (
          <>
         <ChevronUp className="ml-1 w-4 h-4" />
          </>
        ) : (
          <>
           <ChevronDown className="ml-1 w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
