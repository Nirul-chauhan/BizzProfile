import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Loader2,
  Package,
  Wrench,
  Building2,
  Layers,
  GitBranch,
  Flame,
  CornerDownLeft,
  X,
} from "lucide-react";
import { searchAll } from "../api";

const GROUPS = [
  { key: "products", label: "Products", icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
  { key: "services", label: "Services", icon: Wrench, color: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "businesses", label: "Businesses", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
  { key: "categories", label: "Categories", icon: Layers, color: "text-violet-600", bg: "bg-violet-50" },
  { key: "subcategories", label: "Subcategories", icon: GitBranch, color: "text-amber-600", bg: "bg-amber-50" },
  { key: "best_sellers", label: "Best Sellers", icon: Flame, color: "text-orange-600", bg: "bg-orange-50" },
];

// Every group resolves to the public page that actually shows that entity.
function linkFor(groupKey, item) {
  switch (groupKey) {
    case "products":
    case "best_sellers":
      return `/products/${item.id}`;
    case "services":
      return item.source === "biz_service"
        ? `/biz-services/${item.id}`
        : `/services/detail/${item.slug}`;
    case "businesses":
      return `/enduser/business/${item.slug}`;
    case "categories":
      return `/categories/${item.slug}`;
    case "subcategories":
      // Subcategory slugs are only unique within their category, so the link
      // needs both segments to resolve to the right page.
      return `/categories/${item.category_slug}/${item.slug}`;
    default:
      return "/search";
  }
}

function subtitleFor(groupKey, item) {
  switch (groupKey) {
    case "products":
    case "best_sellers":
      return [item.business_name, item.category_name].filter(Boolean).join(" · ");
    case "services":
      return [item.provider_name, item.category_name].filter(Boolean).join(" · ");
    case "businesses":
      return (
        [item.category_name, item.city, item.state].filter(Boolean).join(" · ") ||
        "Location not set"
      );
    case "categories":
    case "subcategories":
      return item.category_name || item.description || "Explore";
    default:
      return "";
  }
}

// Wraps the matched substring so the user can see *why* a row matched.
function Highlight({ text, query }) {
  if (!text) return null;
  const value = String(text);
  const needle = query.trim();
  if (!needle) return value;
  const idx = value.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) return value;
  return (
    <>
      {value.slice(0, idx)}
      <mark className="bg-amber-200 text-inherit rounded px-0.5">
        {value.slice(idx, idx + needle.length)}
      </mark>
      {value.slice(idx + needle.length)}
    </>
  );
}

export default function GlobalSearch({
  value,
  onChange,
  placeholder = "Search products, services, businesses...",
  className = "",
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bp_recent_searches") || "[]");
    } catch {
      return [];
    }
  });
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Debounce so every keystroke doesn't hit the API; also drop stale responses.
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(() => {
      searchAll({
        q,
        limit: 5,
      })
        .then((res) => {
          if (!cancelled) {
            setResults(res);
            setActiveIndex(-1);
          }
        })
        .catch(() => !cancelled && setResults(null))
        .finally(() => !cancelled && setLoading(false));
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  // Close when clicking outside.
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Flatten groups into one keyboard-navigable list, skipping empty groups.
  const flat = useMemo(() => {
    if (!results) return [];
    const rows = [];
    for (const g of GROUPS) {
      const bucket = results[g.key];
      if (!bucket?.items?.length) continue;
      for (const item of bucket.items) rows.push({ group: g, item });
    }
    return rows;
  }, [results]);

  const totalCount = useMemo(() => {
    if (!results) return 0;
    return GROUPS.reduce((sum, g) => sum + (results[g.key]?.total || 0), 0);
  }, [results]);

  const remember = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recent.filter((r) => r !== trimmed)].slice(0, 6);
    setRecent(next);
    try {
      localStorage.setItem("bp_recent_searches", JSON.stringify(next));
    } catch {
      /* storage unavailable; recent searches are a nicety, not a requirement */
    }
  };

  const go = (path, q) => {
    remember(q);
    setOpen(false);
    navigate(path);
  };

  const submitFullSearch = useCallback(() => {
    const q = value.trim();
    if (!q) return;
    go(`/search?q=${encodeURIComponent(q)}`, q);
  }, [value, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (flat.length ? (i + 1) % flat.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (i - 1 + flat.length) % flat.length : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Enter opens the highlighted row if there is one, else the full page.
      if (activeIndex >= 0 && flat[activeIndex]) {
        const { group, item } = flat[activeIndex];
        go(linkFor(group.key, item), value);
      } else {
        submitFullSearch();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  // Keep the highlighted row visible while arrowing through the list.
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const node = listRef.current.querySelector(`[data-idx="${activeIndex}"]`);
    if (node) node.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const showPanel = open && (value.trim().length >= 2 || recent.length > 0);
  const hasQuery = value.trim().length >= 2;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-autocomplete="list"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
        ) : value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer border-none bg-transparent"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
          <div ref={listRef} className="max-h-[70vh] overflow-y-auto">
            {/* ── Recent searches, before anything is typed ── */}
            {!hasQuery && recent.length > 0 && (
              <div className="p-3">
                <p className="px-1 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  Recent searches
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recent.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onChange(r);
                        inputRef.current?.focus();
                      }}
                      className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer border-none"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasQuery && loading && !results && (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Searching…
              </div>
            )}

            {hasQuery && results && totalCount === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-bold text-gray-900">No results for “{value.trim()}”</p>
                <p className="text-xs text-gray-500 mt-1">
                  Try a shorter word, or browse categories.
                </p>
              </div>
            )}

            {hasQuery && flat.length > 0 && (
              <div className="py-1.5">
                {GROUPS.map((g) => {
                  const bucket = results[g.key];
                  if (!bucket?.items?.length) return null;
                  const Icon = g.icon;
                  return (
                    <div key={g.key} className="mb-1 last:mb-0">
                      <div className="flex items-center gap-1.5 px-4 pt-2 pb-1">
                        <Icon className={`w-3 h-3 ${g.color}`} />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                          {g.label}
                        </span>
                        {bucket.total > bucket.items.length && (
                          <span className="text-[10px] font-bold text-gray-300">
                            {bucket.total}
                          </span>
                        )}
                      </div>
                      {bucket.items.map((item) => {
                        const idx = flat.findIndex(
                          (r) => r.group.key === g.key && r.item.id === item.id
                        );
                        const title =
                          item.name || item.business_name || item.title || "Result";
                        return (
                          <button
                            key={`${g.key}-${item.id}`}
                            data-idx={idx}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => go(linkFor(g.key, item), value)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors cursor-pointer border-none ${
                              activeIndex === idx ? "bg-indigo-50" : "hover:bg-gray-50"
                            }`}
                          >
                            {item.primary_image || item.image_url ? (
                              <img
                                src={item.primary_image || item.image_url}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <span
                                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${g.bg}`}
                              >
                                <Icon className={`w-4 h-4 ${g.color}`} />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold text-gray-900 truncate">
                                <Highlight text={title} query={value} />
                              </span>
                              <span className="block text-xs text-gray-500 truncate">
                                <Highlight text={subtitleFor(g.key, item)} query={value} />
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer: jump to the full results page ── */}
          {hasQuery && totalCount > 0 && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={submitFullSearch}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border-t border-gray-200 text-xs font-extrabold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border-none border-t"
            >
              See all {totalCount} result{totalCount === 1 ? "" : "s"}
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
