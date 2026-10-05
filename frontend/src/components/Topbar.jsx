import { useEffect, useRef, useState } from "react";
import { Bell, Search, ShieldCheck, Wifi, WifiOff, X, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { checkHealth, getNetworkNode } from "../services/api";
import CopyButton from "./CopyButton";

function Topbar({ setActivePage, setSidebarOpen, sidebarOpen }) {
  const [apiConnected, setApiConnected] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const pageSearch = [
    ["dashboard", "Dashboard"],
    ["detection", "Flow Detection"],
    ["enterprise", "Enterprise Evaluation"],
    ["dynamic", "Dynamic Network"],
    ["analytics", "Analytics"],
    ["research", "Research Results"],
    ["lateral", "Lateral Movement"],
    ["model", "Model"],
    ["settings", "Settings"],
  ];
  const searchRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const checkConnection = async () => {
      try {
        await checkHealth();
        if (mounted) setApiConnected(true);
      } catch {
        if (mounted) setApiConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "/" && document.activeElement !== searchRef.current) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setSearchResult(null);
        setSearchError("");
        setNotificationsOpen(false);
        searchRef.current?.blur();
      }
    };
    const onPointer = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  const runSearch = async (event) => {
    event?.preventDefault();
    const query = searchValue.trim();
    if (!query) return;

    const normalized = query.toLowerCase();
    const page = pageSearch.find(([id, label]) =>
      id === normalized ||
      label.toLowerCase() === normalized ||
      label.toLowerCase().includes(normalized)
    );

    if (page) {
      setActivePage?.(page[0]);
      setSearchResult({ page: page[1] });
      setSearchError("");
      return;
    }

    const ip = query;
    setSearching(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const response = await getNetworkNode(ip);
      const node = response?.node || response;
      setSearchResult({ node, connections: response?.connections || [] });
      setActivePage?.("dashboard");
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("gnn:network-search", { detail: { ip } }));
      }, 80);
    } catch (error) {
      setSearchError(
        error?.response?.data?.detail ||
          `Network node ${ip} was not found in the CICIDS2017 graph.`
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <header className="cyber-topbar">
      <button
        type="button"
        className="cyber-menu-button"
        aria-label="Open navigation"
        aria-controls="primary-navigation"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen?.((open) => !open)}
      >
        <span aria-hidden="true">☰</span>
      </button>
      <motion.div
        className="cyber-topbar-left"
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="cyber-title-block">
          <div className="cyber-title-row">
            <span className="cyber-topbar-mark">SECURITY OPERATIONS CENTER / GNN</span>
            <span className="cyber-live-label"><i /> LIVE</span>
          </div>
          <p className="cyber-topbar-sub">EDGE-AWARE GRAPH MONITORING / CICIDS2017 / RESEARCH ENVIRONMENT</p>
        </div>
      </motion.div>

      <motion.div
        className="cyber-topbar-actions"
        initial={{ opacity: 0, x: 22 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.85, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="cyber-search-wrap">
          <form className="cyber-search" onSubmit={runSearch}>
            <Search size={13} />
            <input
              ref={searchRef}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setSearchError("");
                setSearchResult(null);
              }}
              placeholder="SEARCH NETWORK..."
              aria-label="Search network IP address"
              spellCheck="false"
            />
            <kbd>/</kbd>
          </form>

          <AnimatePresence>
            {(searchResult || searchError || searching) && (
              <motion.div
                className="cyber-search-popover"
                initial={{ opacity: 0, y: -5, clipPath: "inset(0 0 100% 0)" }}
                animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
              >
                {searching && <div className="cyber-search-state"><span className="cyber-loader-line" /> SEARCHING NETWORK...</div>}
                {!searching && searchError && <div className="cyber-search-error">{searchError}</div>}
                {!searching && searchResult?.page && (
                  <button
                    type="button"
                    className="cyber-search-result"
                    onClick={() => setSearchResult(null)}
                  >
                    <span className="cyber-result-dot" />
                    <span>
                      <strong>{searchResult.page}</strong>
                      <small>Open section</small>
                    </span>
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </button>
                )}

                {!searching && searchResult?.node && (
                  <div className="cyber-search-result cyber-search-result-static">
                    <span className="cyber-result-dot" />
                    <span>
                      <strong>{searchResult.node?.ip || searchValue}</strong>
                      <small>Network node in CICIDS2017 graph</small>
                    </span>
                    <CopyButton value={searchResult.node?.ip || searchValue} label="Copy" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          className={`cyber-connection ${apiConnected ? "online" : "offline"}`}
          animate={apiConnected ? { boxShadow: ["0 0 0 rgba(68,215,154,0)", "0 0 18px rgba(68,215,154,.12)", "0 0 0 rgba(68,215,154,0)"] } : {}}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          {apiConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{apiConnected ? "API CONNECTED" : "API OFFLINE"}</span>
          <i />
        </motion.div>

        <div className="cyber-notification-wrap" ref={notificationRef}>
          <button
            type="button"
            className={`cyber-icon-button ${notificationsOpen ? "is-open" : ""}`}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Bell size={14} />
            <span className="cyber-notification-dot" />
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                className="cyber-notification-panel"
                initial={{ opacity: 0, y: -8, scale: .98, clipPath: "inset(0 0 100% 0)" }}
                animate={{ opacity: 1, y: 0, scale: 1, clipPath: "inset(0 0 0 0)" }}
                exit={{ opacity: 0, y: -5, scale: .99 }}
                transition={{ duration: .24, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="cyber-notification-head">
                  <span>SYSTEM EVENTS</span>
                  <b>LIVE</b>
                </div>
                <div className="cyber-notification-item">
                  <i className="ok" />
                  <span><strong>GNN engine operational</strong><small>Edge-aware inference service is connected.</small></span>
                </div>
                <div className="cyber-notification-item">
                  <i className="cyan" />
                  <span><strong>Network graph ready</strong><small>CICIDS2017 context graph loaded.</small></span>
                </div>
                <div className="cyber-notification-item">
                  <i className="red" />
                  <span><strong>Threat channel armed</strong><small>Detection threshold: 0.67</small></span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="cyber-security-chip">
          <ShieldCheck size={13} />
          <span>GNN / 0.67</span>
        </div>
      </motion.div>
    </header>
  );
}

export default Topbar;
