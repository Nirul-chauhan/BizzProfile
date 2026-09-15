import { Zap, ShieldCheck, Globe, Users, BarChart3, Lock } from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "Verified Profiles", description: "Every business profile is verified to ensure authenticity and build trust with customers." },
  { icon: Globe, title: "Wide Coverage", description: "Find businesses across multiple categories and locations, all in one platform." },
  { icon: Users, title: "Community Driven", description: "Ratings and reviews from real customers help you make informed decisions." },
  { icon: BarChart3, title: "Analytics Dashboard", description: "Business owners get insights into profile views, customer interactions, and more." },
  { icon: Lock, title: "Secure & Private", description: "Your data is protected with enterprise-grade security and privacy controls." },
  { icon: Zap, title: "Instant Connect", description: "Connect with businesses instantly through calls, messages, or WhatsApp." },
];

export default function FeaturesView() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Features</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">Everything you need to discover, connect, and grow with trusted businesses.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="p-8 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
