import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";
import Detection from "./components/DetectionPanel";
import EnterpriseEvaluation from "./pages/EnterpriseEvaluation";
import DynamicNetworkGraph from "./pages/DynamicNetworkGraph";
import Analytics from "./pages/Analytics";
import ResearchResults from "./pages/ResearchResults";
import LateralMovement from "./pages/LateralMovement";
import Model from "./pages/Model";
import Settings from "./pages/Settings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import BackToTop from "./components/BackToTop";
import CookieBanner from "./components/CookieBanner";
import ScrollProgress from "./components/ScrollProgress";

/* =========================================================
   PAGE ROUTES
========================================================= */

const pages = {
  dashboard: Dashboard,
  detection: Detection,
  enterprise: EnterpriseEvaluation,
  dynamic: DynamicNetworkGraph,
  analytics: Analytics,
  research: ResearchResults,
  lateral: LateralMovement,
  model: Model,
  settings: Settings,
  privacy: PrivacyPolicy,
};

/* =========================================================
   BOOT SEQUENCE
========================================================= */

function BootSequence({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1750);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="cyber-boot" aria-hidden="true">
      <div className="cyber-boot-grid" />

      <div className="cyber-boot-center">
        <div className="cyber-boot-logo">GNN</div>

        <div className="cyber-boot-title">
          SECURITY ENGINE
        </div>

        <div className="cyber-boot-meta">
          INITIALIZING GRAPH INFERENCE / CICIDS2017
        </div>

        <div className="cyber-boot-progress">
          <span />
        </div>

        <div className="cyber-boot-status">
          <span>SYS</span>{" "}
          ONLINE <b>///</b> EDGE-GNN READY
        </div>
      </div>

      <div className="cyber-boot-corner">
        SECURE RESEARCH ENVIRONMENT / 0.67
      </div>
    </div>
  );
}

/* =========================================================
   MAIN APPLICATION
========================================================= */

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [booting, setBooting] = useState(true);
  const [interfaceReady, setInterfaceReady] = useState(false);

  useEffect(() => {
    const openPrivacy = () => setActivePage("privacy");
    const openSettings = () => setActivePage("settings");
    window.addEventListener("open-privacy", openPrivacy);
    window.addEventListener("open-settings", openSettings);
    return () => {
      window.removeEventListener("open-privacy", openPrivacy);
      window.removeEventListener("open-settings", openSettings);
    };
  }, []);

  useEffect(() => {
    if (import.meta.env.PROD && window.location.protocol === "http:" && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      window.location.replace(`https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    for (const [key, value] of params.entries()) {
      if (key.toLowerCase().startsWith("utm_")) utm[key] = value;
    }
    if (Object.keys(utm).length) {
      try {
        sessionStorage.setItem("gnn_utm", JSON.stringify({ ...utm, capturedAt: new Date().toISOString() }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    const openLateral = () => setActivePage("lateral");

    window.addEventListener("open-lateral-page", openLateral);

    return () => {
      window.removeEventListener("open-lateral-page", openLateral);
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [activePage]);

  useEffect(() => {
    if (!booting) {
      const frame = requestAnimationFrame(() => {
        setInterfaceReady(true);
      });

      return () => cancelAnimationFrame(frame);
    }

    setInterfaceReady(false);
  }, [booting, activePage]);

  const Page = pages[activePage] || Dashboard;

  return (
    <div
      className={`
        cyber-app
        min-h-screen
        bg-black
        text-white
        ${interfaceReady ? "interface-ready" : ""}
      `}
    >
      {booting && (
        <BootSequence onDone={() => setBooting(false)} />
      )}

      <div className="cyber-atmosphere" aria-hidden="true">
        <div className="cyber-network-bg">
          <span className="cyber-orbit orbit-a" />
          <span className="cyber-orbit orbit-b" />
          <span className="cyber-orbit orbit-c" />

          <span className="cyber-network-core" />

          <span className="cyber-bg-node n1" />
          <span className="cyber-bg-node n2" />
          <span className="cyber-bg-node n3" />
          <span className="cyber-bg-node n4" />
          <span className="cyber-bg-node n5" />
          <span className="cyber-bg-node n6" />
          <span className="cyber-bg-node n7" />
          <span className="cyber-bg-node n8" />
        </div>

        <span className="cyber-grid-drift" />
        <span className="cyber-scan-beam" />

        <span className="cyber-corner-mark top-left" />
        <span className="cyber-corner-mark top-right" />
        <span className="cyber-corner-mark bottom-left" />
        <span className="cyber-corner-mark bottom-right" />
      </div>

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="cyber-main min-h-screen">
        <Topbar
          setActivePage={setActivePage}
          setSidebarOpen={setSidebarOpen}
          sidebarOpen={sidebarOpen}
        />

        <main id="main-content" tabIndex="-1" className="cyber-content px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              className="cyber-page-transition"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{
                duration: 0.22,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Page />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ScrollProgress />
      <CookieBanner />
      <BackToTop />
    </div>
  );
}

export default App;
