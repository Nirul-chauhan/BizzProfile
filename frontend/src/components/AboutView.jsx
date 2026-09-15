import { CheckCircle2, ShieldCheck, Users, Building2, Globe, Award } from "lucide-react";
import { ABOUT_CHECKLIST, ABOUT_BADGES } from "./sharedViewData";

export default function AboutView() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section id="section-about" className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">About BizzProfiles</h1>
            <p className="text-lg text-white/80">We connect customers with trusted, verified businesses in their local area. Our platform makes it easy to find the right service provider for any need.</p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-gray-600 mb-6">BizzProfiles is dedicated to creating a trusted marketplace where businesses can showcase their services and customers can find verified, reliable providers. We believe in transparency, trust, and community connections.</p>
              <div className="space-y-4">
                {ABOUT_CHECKLIST.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {ABOUT_BADGES.map((badge, i) => {
                const icons = [ShieldCheck, Users, Building2, Globe, Award];
                const Icon = icons[i % icons.length];
                return (
                  <div key={i} className="p-6 bg-gray-50 rounded-2xl text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{badge.value}</div>
                    <div className="text-sm text-gray-500">{badge.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-2xl border border-gray-200 text-center">
              <ShieldCheck className="w-10 h-10 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Trust & Verification</h3>
              <p className="text-sm text-gray-600">Every business on our platform is verified to ensure you're connecting with legitimate, quality service providers.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-gray-200 text-center">
              <Users className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Community First</h3>
              <p className="text-sm text-gray-600">We prioritize local businesses and community connections to strengthen the neighborhoods we serve.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-gray-200 text-center">
              <Globe className="w-10 h-10 text-violet-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Accessibility</h3>
              <p className="text-sm text-gray-600">Our platform is designed to be easy to use for everyone, making business discovery simple and efficient.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
