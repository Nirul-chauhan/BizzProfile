import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import Header from "./components/Header";
import PublicView from "./components/PublicView";
import AdminAuth from "./components/AdminAuth";
import CustomerAuth from "./components/CustomerAuth";
import EndUserAuth from "./components/EndUserAuth";
import AdminDashboard from "./components/AdminDashboard";
import CustomerForm from "./components/CustomerForm";
import CustomerDashboard from "./components/CustomerDashboard";
import EndUserView from "./components/EndUserView";
import BusinessDetail from "./components/BusinessDetail";
import BusinessDirectory from "./components/BusinessDirectory";
import ErrorBoundary from "./components/ErrorBoundary";

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
    </div>
  );
}

function Privacy() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-gray-600 mb-4">Your privacy is important to us. BizzProfiles collects only the information necessary to provide our services.</p>
      <p className="text-gray-600 mb-4">We do not sell or share your personal data with third parties for marketing purposes.</p>
      <p className="text-gray-600">For questions, contact support@bizzprofiles.com</p>
    </div>
  );
}

function Terms() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-gray-600 mb-4">By using BizzProfiles, you agree to these terms of service.</p>
      <p className="text-gray-600 mb-4">You are responsible for maintaining the accuracy of your business profile information.</p>
      <p className="text-gray-600">For questions, contact support@bizzprofiles.com</p>
    </div>
  );
}

function ContactThankYou() {
  return (
    <div className="max-w-2xl mx-auto py-20 px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
      <p className="text-gray-600 mb-6">Your message has been sent. We'll get back to you soon.</p>
      <a href="/" className="text-blue-600 font-bold hover:underline">Back to Home</a>
    </div>
  );
}

function LoginSignup() {
  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Login / Register</h1>
      <div className="space-y-4">
        <a href="/auth/admin" className="block p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all no-underline text-center">
          <h3 className="font-bold text-gray-900">Admin</h3>
        </a>
        <a href="/auth/customer" className="block p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all no-underline text-center">
          <h3 className="font-bold text-gray-900">Customer</h3>
        </a>
        <a href="/auth/enduser" className="block p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all no-underline text-center">
          <h3 className="font-bold text-gray-900">End User</h3>
        </a>
      </div>
    </div>
  );
}

function CustomerSections() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-2xl font-bold mb-4">Customer Dashboard</h1>
      <p className="text-gray-600">Please visit your <a href="/customer/dashboard" className="text-blue-600 hover:underline">dashboard</a>.</p>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<PublicView />} />
          <Route path="/about" element={<Navigate to="/#section-about" replace />} />
          <Route path="/contact" element={<Navigate to="/#section-contact" replace />} />
          <Route path="/contact/thank-you" element={<ContactThankYou />} />
          <Route path="/features" element={<Navigate to="/#section-about" replace />} />
          <Route path="/businesses" element={<BusinessDirectory />} />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/auth/admin" element={<AdminAuth />} />
          <Route path="/auth/customer" element={<CustomerAuth />} />
          <Route path="/auth/enduser" element={<EndUserAuth />} />
          <Route path="/blogs" element={<Navigate to="/#section-blogs" replace />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/customer/:section" element={<CustomerSections />} />
          <Route path="/admin/:section" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/dashboard/:section" element={<CustomerDashboard />} />
        <Route path="/customer/form" element={<CustomerForm />} />
        <Route path="/enduser" element={<EndUserView />} />
        <Route path="/enduser/business/:slug" element={<BusinessDetail />} />
      </Routes>
    </ErrorBoundary>
  );
}
