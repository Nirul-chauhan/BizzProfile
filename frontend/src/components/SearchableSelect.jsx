import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";

export default function SearchableSelect({ label, value, onChange, options, placeholder, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (opt) => {
    onChange(opt);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 0); }}
        className={`w-full flex items-center gap-3 px-4 py-4 bg-gray-50 border-2 rounded-2xl text-left transition-all outline-none cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        {Icon && <Icon className="w-5 h-5 text-gray-400 shrink-0" />}
        <span className={`flex-1 text-base ${value ? "text-gray-900" : "text-gray-400"}`}>
          {value || placeholder}
        </span>
        {value && (
          <button type="button" onClick={handleClear} className="p-1 hover:bg-gray-200 rounded-lg border-none bg-transparent cursor-pointer">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer ${
                    value === opt ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700"
                  }`}
                >
                  {opt}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
