import {
  Activity,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  GitBranch,
  LayoutDashboard,
  Settings,
  UploadCloud,
  X,
} from "lucide-react";

const navigation = [
  { id: "dashboard", label: "Dashboard", code: "01", icon: LayoutDashboard },
  { id: "detection", label: "Flow Detection", code: "02", icon: Activity },
  { id: "enterprise", label: "Enterprise Evaluation", code: "03", icon: UploadCloud },
  { id: "dynamic", label: "Dynamic Network", code: "04", icon: GitBranch },
  { id: "analytics", label: "Analytics", code: "05", icon: BarChart3 },
  { id: "research", label: "Research Results", code: "06", icon: BrainCircuit },
  { id: "lateral", label: "Lateral Movement", code: "07", icon: GitBranch },
  { id: "model", label: "Model", code: "08", icon: BrainCircuit },
];

function GnnLogo() {
  return (
    <svg className="cyber-brand-svg" viewBox="0 0 64 64" aria-hidden="true">
      <path className="logo-hex" d="M32 3 57 17v30L32 61 7 47V17L32 3Z" />
      <path className="logo-inner" d="M32 14 45 21v14c0 9-5.7 14.4-13 17-7.3-2.6-13-8-13-17V21l13-7Z" />
      <circle cx="32" cy="23" r="2.7" className="logo-node" />
      <circle cx="21" cy="32" r="2.7" className="logo-node" />
      <circle cx="43" cy="32" r="2.7" className="logo-node" />
      <path className="logo-link" d="M32 25.7v10M23.5 31l6-5M40.5 31l-6-5M24 32h16" />
      <circle cx="32" cy="42" r="2.7" className="logo-node-accent" />
      <path className="logo-link" d="M32 36v3.3" />
    </svg>
  );
}

function Sidebar({
  activePage,
  setActivePage,
  sidebarOpen,
  setSidebarOpen,
}) {
  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="cyber-overlay lg:hidden"
        />
      )}

      <aside
        className={`
          cyber-sidebar
          fixed left-0 top-0 z-[60] h-screen
          ${sidebarOpen ? "is-open" : ""}
        `}
      >
        <div className="flex h-full flex-col">
          <div className="cyber-brand">
            <button
              type="button"
              className="cyber-brand-link"
              onClick={() => navigate("dashboard")}
              aria-label="GNN Security Engine dashboard"
            >
              <div className="cyber-brand-logo">
                <GnnLogo />
              </div>

              <div className="cyber-brand-copy">
                <div className="cyber-kicker">
                  GNN / SECURITY ENGINE
                </div>
                <div className="cyber-brand-sub">
                  ENTERPRISE / SOC
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="cyber-close-mobile lg:hidden"
              aria-label="Close navigation"
            >
              <X size={17} />
            </button>
          </div>

          <div className="cyber-sidebar-nav px-4 pt-8">
            <div className="cyber-section-label">
              OPERATIONS / SYSTEM
            </div>

            <nav className="mt-4 space-y-2">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const active = activePage === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id)}
                    className={`cyber-nav-item group ${active ? "is-active" : ""}`}
                    style={{
                      "--nav-delay": `${0.35 + index * 0.07}s`,
                    }}
                  >
                    <span className="cyber-nav-code" aria-hidden="true">
                      {item.code}
                    </span>

                    <Icon size={15} aria-hidden="true" />

                    <span className="cyber-nav-label">
                      {item.label}
                    </span>

                    {active && (
                      <span className="cyber-nav-chevron" aria-hidden="true">
                        <ChevronRight size={13} />
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto px-4 pb-5">
            <button
              type="button"
              onClick={() => navigate("settings")}
              className={`cyber-nav-item mb-4 ${
                activePage === "settings" ? "is-active" : ""
              }`}
              style={{ "--nav-delay": "0.8s" }}
            >
              <span className="cyber-nav-code" aria-hidden="true">
                09
              </span>

              <Settings size={15} aria-hidden="true" />

              <span className="cyber-nav-label">Settings</span>

              {activePage === "settings" && (
                <span className="cyber-nav-chevron" aria-hidden="true">
                  <ChevronRight size={13} />
                </span>
              )}
            </button>

            <div className="cyber-status-block">
              <div className="flex items-center gap-2">
                <span className="cyber-live-dot" />
                <span className="cyber-status-title">
                  ENGINE ONLINE
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                <span>MODEL</span>
                <b>Edge-Aware GNN</b>

                <span>DEVICE</span>
                <b>CPU</b>

                <span>THRESHOLD</span>
                <b>0.67</b>
              </div>

              <div className="mt-3 border-t border-white/[0.06] pt-3 text-xs leading-5 text-slate-500">
                CICIDS2017 / unseen-category evaluation
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;