import { Link } from "react-router-dom";
import { Grid3X3 } from "lucide-react";

/* Every `to` below points to a route that exists in App.jsx.
   Items without a real page (Help Center, User Guide, policies,
   Success Stories, News, Careers, Videos) are intentionally omitted
   rather than linked to fake URLs. */
const FOOTER_COLUMNS = [
  {
    title: "Customer Support",
    links: [{ label: "Contact Support", to: "/contact" }],
  },
  {
    title: "About BizzProfile",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Blog", to: "/blogs" },
      { label: "Contact Us", to: "/contact" },
    ],
  },
  {
    title: "Our Services",
    links: [
      { label: "Advertise With Us", to: "/membership-plans" },
      { label: "Business Services", to: "/services" },
      { label: "Tradeshows & Exhibitions", to: "/tradeshows-exhibitions" },
      { label: "Buy Trade Leads", to: "/buy-trade-leads" },
      { label: "Book Domain", to: "/book-domain" },
      { label: "Find Distributors", to: "/find-distributors" },
    ],
  },
  {
    title: "For Sellers",
    links: [
      { label: "Add New Product", to: "/seller/dashboard/products" },
      { label: "Seller Dashboard", to: "/seller/dashboard" },
      { label: "Seller Enquiries", to: "/seller/dashboard/enquiries" },
    ],
  },
  {
    title: "For Buyers",
    links: [
      { label: "Post Requirement", to: "/buyer/dashboard/requirements" },
      { label: "Browse Products", to: "/categories" },
      { label: "Browse Suppliers", to: "/businesses" },
      { label: "My Inquiries", to: "/buyer/dashboard/enquiries" },
      { label: "Buyer Dashboard", to: "/buyer/dashboard" },
    ],
  },
  {
    title: "Directory",
    links: [
      { label: "Categories", to: "/categories" },
      { label: "Products", to: "/categories" },
      { label: "Businesses", to: "/businesses" },
      { label: "Services", to: "/services" },
      { label: "Suppliers", to: "/businesses" },
    ],
  },
];

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        {/* Link columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-8 pb-10">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="min-w-0">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5 list-none p-0 m-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-400 hover:text-white transition-colors break-words no-underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar: brand + legal links */}
        <div className="border-t border-gray-800 pt-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Grid3X3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-extrabold text-white">BizzProfile</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xl">
              Your trusted B2B marketplace for finding verified businesses, products and
              services — connect with the right suppliers and grow your business.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm lg:justify-end">
            <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors no-underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-white transition-colors no-underline">
              Terms &amp; Conditions
            </Link>
            <Link to="/contact" className="text-gray-400 hover:text-white transition-colors no-underline">
              Contact / Support
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6">
          <p className="text-xs text-center text-gray-500">
            &copy; {currentYear} BizzProfile. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
