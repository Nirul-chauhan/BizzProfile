import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, ChevronDown, LayoutGrid, Loader } from "lucide-react";
import { getCategoryTree } from "../api";

function CategoryIcon({ icon, className = "w-4 h-4" }) {
  if (!icon) return <LayoutGrid className={className} />;
  return <LayoutGrid className={className} />;
}

export function CategorySidebar({ selectedCategoryId, onSelect }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    let mounted = true;
    getCategoryTree()
      .then((data) => { if (mounted) setTree(data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-5 h-5 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">Categories</h3>
      </div>
      <nav className="max-h-[calc(100vh-200px)] overflow-y-auto">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
            !selectedCategoryId ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          All Categories
        </button>

        {tree.map((cat) => (
          <div key={cat.id}>
            <div className="flex items-center">
              <button
                onClick={() => onSelect(cat.id)}
                className={`flex-1 text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                  selectedCategoryId === cat.id ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <CategoryIcon icon={cat.icon} />
                <span className="flex-1 truncate">{cat.name}</span>
                {(cat.children?.length > 0 || cat.subcategories?.length > 0) && (
                  <span
                    onClick={(e) => { e.stopPropagation(); toggleExpand(cat.id); }}
                    className="p-0.5 rounded hover:bg-gray-200"
                  >
                    {expanded[cat.id] ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </span>
                )}
              </button>
            </div>

            {expanded[cat.id] && (
              <div className="pl-6">
                {cat.children?.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onSelect(child.id)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      selectedCategoryId === child.id ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {child.name}
                  </button>
                ))}
                {cat.subcategories?.map((sub) => (
                  <Link
                    key={sub.id}
                    to={`/categories/${cat.slug}/${sub.slug}`}
                    className="block px-4 py-2 text-sm text-gray-500 hover:text-indigo-600 hover:bg-gray-50"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}


export function CategoryMenu() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    getCategoryTree()
      .then((data) => { if (mounted) setTree(data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />;

  return (
    <div
      className="relative"
      onMouseLeave={() => setHovered(null)}
    >
      <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
        <LayoutGrid className="w-4 h-4" />
        Categories
        <ChevronDown className="w-3 h-3" />
      </button>

      {hovered !== null && (
        <div className="absolute top-full left-0 z-50 w-[600px] bg-white border border-gray-200 rounded-xl shadow-xl mt-1 p-4 grid grid-cols-3 gap-4">
          {tree.slice(0, 9).map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-50 text-sm text-gray-700 hover:text-indigo-700 transition-colors"
              onClick={() => setHovered(null)}
            >
              <CategoryIcon icon={cat.icon} className="w-5 h-5 text-indigo-500" />
              <span className="truncate">{cat.name}</span>
            </Link>
          ))}
          <Link
            to="/categories"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors col-span-3"
            onClick={() => setHovered(null)}
          >
            View All Categories
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <button
        className="fixed inset-0 z-40"
        style={{ display: hovered !== null ? "block" : "none" }}
        onClick={() => setHovered(null)}
      />
    </div>
  );
}


export function CategoryMegaMenu() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRoot, setActiveRoot] = useState(null);

  useEffect(() => {
    let mounted = true;
    getCategoryTree()
      .then((data) => { if (mounted) setTree(data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return null;

  const activeCategory = tree.find((c) => c.id === activeRoot);

  return (
    <div className="w-full bg-white border-b border-gray-200 hidden lg:block">
      <div className="max-w-7xl mx-auto flex">
        {/* Root categories - left column */}
        <div className="w-64 border-r border-gray-100 py-2">
          {tree.map((cat) => (
            <button
              key={cat.id}
              onMouseEnter={() => setActiveRoot(cat.id)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                activeRoot === cat.id ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <CategoryIcon icon={cat.icon} className="w-4 h-4" />
              <span className="flex-1">{cat.name}</span>
              {(cat.children?.length > 0 || cat.subcategories?.length > 0) && (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </button>
          ))}
        </div>

        {/* Children - right area */}
        {activeCategory && (
          <div className="flex-1 p-6 grid grid-cols-3 gap-6">
            {activeCategory.children?.map((child) => (
              <div key={child.id}>
                <Link
                  to={`/categories/${child.slug}`}
                  className="text-sm font-semibold text-gray-900 hover:text-indigo-600"
                >
                  {child.name}
                </Link>
                {child.subcategories?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {child.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/categories/${activeCategory.slug}/${sub.slug}`}
                        className="block text-sm text-gray-500 hover:text-indigo-600"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {activeCategory.subcategories?.length > 0 && !activeCategory.children?.length && (
              <div className="col-span-3">
                <div className="grid grid-cols-3 gap-4">
                  {activeCategory.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/categories/${activeCategory.slug}/${sub.slug}`}
                      className="text-sm text-gray-600 hover:text-indigo-600"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


export function CategoryBreadcrumbs({ categoryId }) {
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  useEffect(() => {
    if (!categoryId) return;
    let mounted = true;
    getCategoryBreadcrumbs(categoryId)
      .then((data) => { if (mounted) setBreadcrumbs(data); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [categoryId]);

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
      <Link to="/categories" className="hover:text-indigo-600">Home</Link>
      {breadcrumbs.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          {i === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 font-medium">{crumb.name}</span>
          ) : (
            <Link to={`/categories/${crumb.slug}`} className="hover:text-indigo-600">
              {crumb.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
