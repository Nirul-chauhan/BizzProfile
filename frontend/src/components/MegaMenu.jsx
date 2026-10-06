import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Grid3X3, ChevronRight } from "lucide-react";
import { getCategoryTree } from "../api";

export default function MegaMenu() {
  const [categories, setCategories] = useState([]);
  const [openCategory, setOpenCategory] = useState(null);
  const closeTimer = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    getCategoryTree()
      .then((data) => setCategories(data.slice(0, 10)))
      .catch(() => {});
  }, []);

  const handleEnter = useCallback((catId) => {
    clearTimeout(closeTimer.current);
    setOpenCategory(catId);
  }, []);

  const handleLeave = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpenCategory(null), 250);
  }, []);

  const handleClick = useCallback((catId) => {
    setOpenCategory((prev) => (prev === catId ? null : catId));
  }, []);

  useEffect(() => {
    const outside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenCategory(null);
      }
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const activeCat = categories.find((c) => c.id === openCategory);

  return (
    <div ref={menuRef} className="relative">
      {/* Desktop — category names directly in the bar */}
      <nav className="hidden lg:flex items-center gap-0.5">
        {categories.map((cat) => {
          const hasDropdown =
            (cat.children && cat.children.length > 0) ||
            (cat.subcategories && cat.subcategories.length > 0);
          return (
            <div
              key={cat.id}
              onMouseEnter={() => hasDropdown && handleEnter(cat.id)}
              onMouseLeave={() => hasDropdown && handleLeave()}
            >
              <button
                onClick={() => hasDropdown && handleClick(cat.id)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer border-none ${
                  openCategory === cat.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:bg-white/70 hover:text-gray-900 bg-transparent"
                }`}
              >
                {cat.name}
                {hasDropdown && (
                  <ChevronDown
                    className={`w-3 h-3 opacity-50 transition-transform ${
                      openCategory === cat.id ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
            </div>
          );
        })}
        <Link
          to="/categories"
          className="px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-white/70 transition-all no-underline whitespace-nowrap"
        >
          All Categories
        </Link>
      </nav>

      {/* Desktop Dropdown Panel */}
      {openCategory && activeCat && (
        <div
          onMouseEnter={() => handleEnter(openCategory)}
          onMouseLeave={handleLeave}
          className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 w-[600px] max-h-[420px] overflow-y-auto"
        >
          {/* Category header */}
          <div className="px-5 pt-5 pb-3 border-b border-gray-100">
            <Link
              to={`/categories/${activeCat.slug}`}
              className="text-base font-bold text-gray-900 hover:text-blue-600 no-underline"
              onClick={() => setOpenCategory(null)}
            >
              {activeCat.name}
            </Link>
            {activeCat.description && (
              <p className="text-xs text-gray-400 mt-0.5">{activeCat.description}</p>
            )}
          </div>

          <div className="p-4">
            {/* Child categories (top-level children) */}
            {activeCat.children && activeCat.children.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                  Categories
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {activeCat.children.map((child) => (
                    <Link
                      key={child.id}
                      to={`/categories/${child.slug}`}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors no-underline group"
                      onClick={() => setOpenCategory(null)}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors flex-shrink-0">
                        {child.icon_url ? (
                          <img src={child.icon_url} alt="" className="w-5 h-5 object-contain" />
                        ) : (
                          <Grid3X3 className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 truncate">
                        {child.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Subcategories */}
            {activeCat.subcategories && activeCat.subcategories.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                  Services
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {activeCat.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/categories/${activeCat.slug}/${sub.slug}`}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors no-underline group"
                      onClick={() => setOpenCategory(null)}
                    >
                      <span className="text-sm text-gray-600 group-hover:text-blue-600 truncate">
                        {sub.name}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* View All link */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link
                to={`/categories/${activeCat.slug}`}
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 no-underline px-1"
                onClick={() => setOpenCategory(null)}
              >
                View all in {activeCat.name}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile / tablet — horizontally scrolling category strip.
          This replaced a vertical accordion that could never be seen: the bar
          that hosts this component was `hidden lg:block`, so below `lg` there
          was no category navigation anywhere. A single scrollable row also
          keeps the fixed header a predictable height. Each chip lands on the
          category page, which lists its sub-groups, subcategories and
          businesses. */}
      <div className="lg:hidden">
        <nav className="flex items-center gap-2 overflow-x-auto py-2 -mx-4 px-4 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors no-underline"
            >
              {cat.name}
              {(cat.children?.length > 0 || cat.subcategories?.length > 0) && (
                <ChevronRight className="w-3 h-3 text-gray-300" />
              )}
            </Link>
          ))}
          <Link
            to="/categories"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors no-underline"
          >
            <Grid3X3 className="w-3 h-3" />
            All Categories
          </Link>
        </nav>
      </div>
    </div>
  );
}
