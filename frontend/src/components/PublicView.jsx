import { useState, useEffect } from "react";
import {
  HomeSection, AboutSection, BusinessSection, BlogsSection,
  ContactSection, GlobalCTASection, BlogModal,
} from "./sharedSections";

export default function PublicView() {
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#section-", "");
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(`section-${hash}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeSection />
      <AboutSection />
      <BusinessSection />
      <BlogsSection selectedBlog={selectedBlog} setSelectedBlog={setSelectedBlog} />
      <ContactSection />
      <GlobalCTASection />
      <BlogModal selectedBlog={selectedBlog} setSelectedBlog={setSelectedBlog} />
    </div>
  );
}
