import { useState, useEffect, createElement } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Target,
  Globe2,
  Crown,
  Network,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const LIST_URL = `${API_BASE}/api/public/more-value-adds`;

// Representative icons for each card. The database can pin one by name; cards
// without a usable icon fall back to the same set by position.
const FALLBACK_ICONS = [CalendarDays, Target, Globe2, Crown, Network];
const ICON_MAP = {
  calendardays: CalendarDays,
  calendar: CalendarDays,
  target: Target,
  globe: Globe2,
  globe2: Globe2,
  crown: Crown,
  network: Network,
};

function pickIcon(item, index) {
  const key = (item.icon || "").trim().toLowerCase();
  return ICON_MAP[key] || FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

/**
 * Destination for each "More Value Adds" card.
 *
 * Rows are seeded with a literal "#" placeholder, so the link has to be derived
 * from the offer itself. Order matters — the first pattern that matches wins, so
 * "Buy Trade Leads" must be tested before the looser lead/distributor patterns.
 */
const VALUE_ADD_ROUTES = [
  { pattern: /trade\s*shows?|trade\s*fairs?|exhibitions?/i, to: "/tradeshows-exhibitions" },
  { pattern: /buy\s*trade|trade\s*leads?|^leads?$|buying\s*leads?/i, to: "/buy-trade-leads" },
  { pattern: /domain|book\s*domain/i, to: "/book-domain" },
  { pattern: /membership|\bplans?\b|subscription/i, to: "/membership-plans" },
  { pattern: /distributors?|dealers?|resellers?/i, to: "/find-distributors" },
];

function resolveDestination(item) {
  // An explicit internal path set by an admin always wins.
  const configured = (item.button_link || "").trim();
  if (configured.startsWith("/") && configured !== "/") {
    return { to: configured };
  }

  const title = (item.title || "").trim();
  const match = VALUE_ADD_ROUTES.find((route) => route.pattern.test(title));
  if (match) return { to: match.to };

  // Only fall back to a raw href for a genuine external URL.
  if (configured && configured !== "#" && /^https?:\/\//i.test(configured)) {
    return { href: configured };
  }
  return null;
}

function CardSkeleton() {
  return (
    <div className="flex h-full min-h-[196px] flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 h-10 w-10 animate-pulse rounded-lg bg-gray-100" />
      <div className="mb-2 h-4 w-4/5 animate-pulse rounded bg-gray-200" />
      <div className="mb-1.5 h-3 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-3 w-3/5 animate-pulse rounded bg-gray-200" />
      <div className="mt-auto h-3.5 w-28 animate-pulse rounded bg-gray-200 pt-4" />
    </div>
  );
}

function ValueAddCard({ item, index }) {
  const [imgFailed, setImgFailed] = useState(false);
  const Icon = pickIcon(item, index);

  const label = item.button_text?.trim() || "Learn More";
  const destination = resolveDestination(item);

  const surface =
    "group relative flex h-full min-h-[196px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md hover:shadow-orange-100/60";

  const body = (
    <>
      {/* Representative icon: uploaded image when available, else the lucide icon. */}
      <span className="mb-3 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-orange-50">
        {item.image_url && !imgFailed ? (
          <img
            src={item.image_url}
            alt=""
            aria-hidden="true"
            onError={() => setImgFailed(true)}
            className="h-6 w-6 object-contain"
          />
        ) : (
          createElement(Icon, {
            className: "h-5 w-5 text-orange-500",
            "aria-hidden": true,
          })
        )}
      </span>

      <h3 className="mb-1.5 text-[15px] font-bold leading-snug text-gray-900">
        {item.title}
      </h3>

      {item.description && (
        <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-gray-500">
          {item.description}
        </p>
      )}

      {/* `mt-auto` pins the CTA to the bottom of every card in the row. */}
      <span className="mt-auto inline-flex w-fit items-center gap-1 text-[13px] font-bold text-orange-600 transition-colors group-hover:text-orange-700">
        {label}{" "}
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </>
  );

  // The whole card is the link, so the CTA text inside it navigates to the
  // same place without needing a second, nested anchor.
  if (destination?.to) {
    return (
      <Link to={destination.to} className={`${surface} no-underline`}>
        {body}
      </Link>
    );
  }

  if (destination?.href) {
    return (
      <a href={destination.href} className={`${surface} no-underline`}>
        {body}
      </a>
    );
  }

  return <article className={surface}>{body}</article>;
}

export default function MoreValueAddsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(LIST_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (controller.signal.aborted) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e?.name === "AbortError") return;
        console.error("More Value Adds: failed to load", e);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  // Fully data-driven from PostgreSQL via FastAPI; the section only renders
  // when there are active rows to show.
  if (loading) {
    return (
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
            More Value Adds
          </h2>
          <div className="mb-6 h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
          More Value Adds
        </h2>
        <div className="mb-6 h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {items.map((item, i) => (
            <ValueAddCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
