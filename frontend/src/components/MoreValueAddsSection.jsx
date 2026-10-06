import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Target,
  Globe2,
  Crown,
  Network,
} from "lucide-react";
import { getMoreValueAdds } from "../api";

const FALLBACK_ICONS = [CalendarDays, Target, Globe2, Crown, Network];

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
    <div className="h-full min-h-[212px] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 h-11 w-11 animate-pulse rounded-xl bg-gray-100" />
      <div className="mb-2 h-4 w-4/5 animate-pulse rounded bg-gray-200" />
      <div className="mb-1.5 h-3 w-full animate-pulse rounded bg-gray-200" />
      <div className="mb-4 h-3 w-3/5 animate-pulse rounded bg-gray-200" />
      <div className="h-3.5 w-24 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

function ValueAddCard({ item, index }) {
  const [imgFailed, setImgFailed] = useState(false);
  const Icon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];

  const label = item.button_text?.trim() || "Learn More";
  const destination = resolveDestination(item);

  const surface =
    "group relative flex h-full min-h-[212px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/60";

  const body = (
    <>
      {/* Decorative wash, kept behind the content. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-50"
      />

      {/* Real image when the admin uploaded one, otherwise a decorative icon. */}
      <span className="relative z-10 mb-3 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50">
        {item.image_url && !imgFailed ? (
          <img
            src={item.image_url}
            alt=""
            aria-hidden="true"
            onError={() => setImgFailed(true)}
            className="h-7 w-7 object-contain transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <Icon className="h-5 w-5 text-orange-500" aria-hidden="true" />
        )}
      </span>

      <h3 className="relative z-10 mb-1.5 text-[15px] font-bold leading-snug text-gray-900 transition-colors duration-300 group-hover:text-orange-700">
        {item.title}
      </h3>

      {item.description && (
        <p className="relative z-10 mb-4 line-clamp-2 text-[13px] leading-relaxed text-gray-600">
          {item.description}
        </p>
      )}

      {/* `mt-auto` keeps the CTA on the baseline of every card in the row, so
          titles and descriptions of differing length still line up. */}
      <span className="relative z-10 mt-auto inline-flex w-fit items-center gap-1 text-[13px] font-bold text-orange-600 transition-colors group-hover:text-orange-700">
        {label}
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
    let cancelled = false;

    (async () => {
      try {
        const data = await getMoreValueAdds();
        if (cancelled) return;
        // The backend already returns active rows ordered by display_order.
        setItems(Array.isArray(data) ? data : data?.items ?? []);
      } catch (e) {
        if (cancelled) return;
        console.error("More Value Adds: failed to load", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // No items (or a failed load) means no orphan heading on the homepage.
  if (!loading && items.length === 0) return null;

  // One horizontal row at every breakpoint. Cards are sized so exactly 5 fit
  // on desktop; anything beyond that overflows into the same scroll axis rather
  // than wrapping onto a second row.
  const rowClasses =
    "-mx-4 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-4 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0 sm:pb-0";
  const cardBasis =
    "w-[230px] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-4*1rem)/5)]";

  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
          More Value Adds
        </h2>
        <div className="mb-6 h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />

        {loading ? (
          <div className={rowClasses}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={cardBasis}>
                <CardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div className={rowClasses}>
            {items.map((item, i) => (
              <div key={item.id} className={cardBasis}>
                <ValueAddCard item={item} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}