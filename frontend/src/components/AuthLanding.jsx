import { useNavigate } from "react-router-dom";
import { ShieldCheck, ShoppingBag, Store, ArrowRight, Users } from "lucide-react";

const ROLES = [
  {
    id: "admin",
    label: "Join as Admin",
    description: "Manage the entire BizzProfiles marketplace. Control users, content, and platform settings.",
    icon: ShieldCheck,
    color: "from-blue-600 to-indigo-700",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    border: "border-blue-200 hover:border-blue-400",
    route: "/auth/admin",
    state: { email: "admin@bizzprofiles.com", password: "admin123" },
  },
  {
    id: "buyer",
    label: "Join as Buyer",
    description: "Discover businesses, products, and services. Send enquiries and get quotations.",
    icon: ShoppingBag,
    color: "from-emerald-600 to-teal-700",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    border: "border-emerald-200 hover:border-emerald-400",
    route: "/auth/buyer",
    state: {},
  },
  {
    id: "seller",
    label: "Join as Seller",
    description: "List your business, products, and services. Reach customers and grow your business.",
    icon: Store,
    color: "from-amber-600 to-orange-700",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    border: "border-amber-200 hover:border-amber-400",
    route: "/auth/seller",
    state: {},
  },
];

export default function AuthLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Welcome to BizzProfiles
          </h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Choose how you want to use the platform
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => navigate(role.route, { state: role.state })}
                className={`group relative bg-white border-2 ${role.border} rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 cursor-pointer`}
              >
                <div className={`w-14 h-14 ${role.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-7 h-7 ${role.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{role.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">{role.description}</p>
                <div className={`flex items-center gap-2 text-sm font-bold ${role.iconColor} group-hover:gap-3 transition-all`}>
                  Get Started <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{" "}
            <button onClick={() => navigate("/auth/buyer")} className="text-blue-600 font-bold hover:underline cursor-pointer border-none bg-transparent">
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
