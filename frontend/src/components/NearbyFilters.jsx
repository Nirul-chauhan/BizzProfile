import { SlidersHorizontal } from "lucide-react";

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "products", label: "Products" },
  { key: "services", label: "Services" },
  { key: "businesses", label: "Businesses" },
  { key: "best_sellers", label: "Best Sellers" },
];

export default function NearbyFilters({
  type,
  onTypeChange,
  categories = [],
  categoryId,
  onCategoryChange,
  sort,
  onSortChange,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Filters</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => onTypeChange(f.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
              type === f.key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <label className="flex-1">
          <span className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Category</span>
          <select
            value={categoryId || ""}
            onChange={(e) => onCategoryChange(e.target.value || null)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-rose-400"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex-1">
          <span className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Sort by</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 focus:outline-none focus:border-gray-300"
          >
            <option value="nearest">Nearest</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>
    </div>
  );
}