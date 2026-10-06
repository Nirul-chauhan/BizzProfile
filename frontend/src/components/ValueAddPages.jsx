import { Link } from "react-router-dom";

/**
 * Destinations for the "More Value Adds" cards on the homepage.
 *
 * These are intentionally content-free: no invented listings, statistics or
 * testimonials. Each page explains the offer and routes the visitor to a real,
 * already-registered BizzProfile path, so nothing dead-ends on a 404.
 */

function ValueAddPage({ title, intro, points, primary, secondary }) {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">{title}</h1>
      <p className="text-gray-600 mb-8">{intro}</p>

      <ul className="space-y-3 mb-10">
        {points.map((point) => (
          <li key={point} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-500" />
            <span className="text-gray-600">{point}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-4">
        <Link
          to={primary.to}
          className="inline-flex items-center rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 no-underline"
        >
          {primary.label}
        </Link>
        {secondary && (
          <Link
            to={secondary.to}
            className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 no-underline"
          >
            {secondary.label}
          </Link>
        )}
      </div>

      <p className="mt-10 text-sm text-gray-500">
        <Link to="/" className="text-blue-600 hover:underline">
          Back to Home
        </Link>
      </p>
    </div>
  );
}

export function TradeshowsExhibitionsPage() {
  return (
    <ValueAddPage
      title="Tradeshows and Exhibitions"
      intro="Discover trade shows, exhibitions and business events happening around you, and connect directly with the businesses taking part."
      points={[
        "Browse verified local businesses across categories.",
        "Send an enquiry to exhibitors before you visit.",
        "Keep every conversation tied to a real business profile.",
      ]}
      primary={{ label: "Browse Businesses", to: "/businesses" }}
      secondary={{ label: "Sign in", to: "/login" }}
    />
  );
}

export function BuyTradeLeadsPage() {
  return (
    <ValueAddPage
      title="Buy Trade Leads"
      intro="Post what you need to source and let verified sellers come to you with genuine quotations, instead of chasing cold contacts."
      points={[
        "Describe your requirement once and receive quotations from sellers.",
        "Compare quotations side by side before you commit.",
        "No invented lead counts — everything comes from real listings.",
      ]}
      primary={{ label: "Sign in as Buyer", to: "/login" }}
      secondary={{ label: "Browse Businesses", to: "/businesses" }}
    />
  );
}

export function BookDomainPage() {
  return (
    <ValueAddPage
      title="Book Domain"
      intro="Claim your business name on BizzProfile and build a public presence buyers and sellers can actually find."
      points={[
        "Reserve a profile address that represents your business.",
        "Publish products, services and contact details in one place.",
        "Stay reachable through a profile you own rather than a third-party listing.",
      ]}
      primary={{ label: "Register Your Business", to: "/auth/enduser" }}
      secondary={{ label: "Sign in", to: "/login" }}
    />
  );
}

export function MembershipPlansPage() {
  return (
    <ValueAddPage
      title="Membership Plans"
      intro="Choose how far you want to take your BizzProfile presence — from a basic public profile to a full business showcase."
      points={[
        "Start with a free public profile.",
        "Add products, services and media as you grow.",
        "Change or cancel your plan at any time.",
      ]}
      primary={{ label: "Get Started", to: "/login" }}
      secondary={{ label: "Browse Businesses", to: "/businesses" }}
    />
  );
}

export function FindDistributorsPage() {
  return (
    <ValueAddPage
      title="Find Distributors For Your Business"
      intro="Reach businesses already serving your area and looking for distribution partners for their products."
      points={[
        "Search verified sellers by category and location.",
        "Send a requirement and receive quotations from interested distributors.",
        "Every enquiry stays on-platform so you keep the relationship.",
      ]}
      primary={{ label: "Browse Businesses", to: "/businesses" }}
      secondary={{ label: "Sign in as Buyer", to: "/login" }}
    />
  );
}
