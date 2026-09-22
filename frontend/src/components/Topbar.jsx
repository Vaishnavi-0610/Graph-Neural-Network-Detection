import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Menu,
  Search,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { checkHealth, getNetworkNode } from "../services/api";

function Topbar({ setActivePage, setSidebarOpen }) {
  const [apiConnected, setApiConnected] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
      if (
        event.key === "/" &&
        document.activeElement !== searchRef.current
      ) {
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
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
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

    const ip = searchValue.trim();
    if (!ip) return;

    setSearching(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const response = await getNetworkNode(ip);
      const node = response?.node || response;

      setSearchResult({
        node,
        connections: response?.connections || [],
      });

      setActivePage?.("dashboard");

      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("gnn:network-search", {
            detail: { ip },
          })
        );
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
        onClick={() => setSidebarOpen?.((open) => !open)}
      >
        <Menu size={18} />
      </button>

      <motion.div
        className="cyber-topbar-left"
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.75,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <div className="cyber-title-block">
          <div className="cyber-title-row">
            <span className="cyber-topbar-mark">
              Security Operations Center / GNN
            </span>

            <span className="cyber-live-label">
              <i />
              LIVE
            </span>
          </div>

          <p className="cyber-topbar-sub">
            Edge-aware graph monitoring / CICIDS2017 / research environment
          </p>
        </div>
      </motion.div>

      <motion.div
        className="cyber-topbar-actions"
        initial={{ opacity: 0, x: 22 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.85,
          delay: 0.18,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <div className="cyber-search-wrap">
          <form className="cyber-search" onSubmit={runSearch}>
            <Search size={15} aria-hidden="true" />

            <input
              ref={searchRef}
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setSearchError("");
                setSearchResult(null);
              }}
              placeholder="Search network IP..."
              aria-label="Search network IP address"
              spellCheck="false"
            />

            <kbd aria-hidden="true">/</kbd>
          </form>

          <AnimatePresence>
            {(searchResult || searchError || searching) && (
              <motion.div
                className="cyber-search-popover"
                initial={{
                  opacity: 0,
                  y: -5,
                  clipPath: "inset(0 0 100% 0)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  clipPath: "inset(0 0 0% 0)",
                }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
              >
                {searching && (
                  <div className="cyber-search-state">
                    <span className="cyber-loader-line" />
                    SEARCHING NETWORK...
                  </div>
                )}

                {!searching && searchError && (
                  <div className="cyber-search-error">
                    {searchError}
                  </div>
                )}

                {!searching && searchResult && (
                  <button
                    type="button"
                    className="cyber-search-result"
                    onClick={() => {
                      setActivePage?.("dashboard");

                      const ip = searchResult.node?.ip;

                      window.setTimeout(() => {
                        if (ip) {
                          window.dispatchEvent(
                            new CustomEvent("gnn:network-search", {
                              detail: { ip },
                            })
                          );
                        }
                      }, 80);

                      setSearchResult(null);
                    }}
                  >
                    <span className="cyber-result-dot" />

                    <span>
                      <strong>
                        {searchResult.node?.ip || searchValue}
                      </strong>

                      <small>
                        {Number(
                          searchResult.node?.degree ||
                            searchResult.node?.connections ||
                            0
                        ).toLocaleString()}{" "}
                        graph connections
                      </small>
                    </span>

                    <ArrowUpRight size={14} aria-hidden="true" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          className={`cyber-connection ${
            apiConnected ? "online" : "offline"
          }`}
          animate={
            apiConnected
              ? {
                  boxShadow: [
                    "0 0 0 rgba(68,215,154,0)",
                    "0 0 18px rgba(68,215,154,.12)",
                    "0 0 0 rgba(68,215,154,0)",
                  ],
                }
              : {}
          }
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-live="polite"
        >
          {apiConnected ? <Wifi size={13} /> : <WifiOff size={13} />}

          <span>
            {apiConnected ? "API CONNECTED" : "API OFFLINE"}
          </span>

          <i />
        </motion.div>

        <div className="cyber-notification-wrap" ref={notificationRef}>
          <button
            type="button"
            className={`cyber-icon-button ${
              notificationsOpen ? "is-open" : ""
            }`}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Bell size={15} />
            <span className="cyber-notification-dot" />
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                className="cyber-notification-panel"
                initial={{
                  opacity: 0,
                  y: -8,
                  scale: 0.98,
                  clipPath: "inset(0 0 100% 0)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  clipPath: "inset(0 0 0 0)",
                }}
                exit={{
                  opacity: 0,
                  y: -5,
                  scale: 0.99,
                }}
                transition={{
                  duration: 0.24,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="cyber-notification-head">
                  <span>System events</span>
                  <b>LIVE</b>
                </div>

                <div className="cyber-notification-item">
                  <i className="ok" />
                  <span>
                    <strong>GNN engine operational</strong>
                    <small>
                      Edge-aware inference service is connected.
                    </small>
                  </span>
                </div>

                <div className="cyber-notification-item">
                  <i className="cyan" />
                  <span>
                    <strong>Network graph ready</strong>
                    <small>
                      CICIDS2017 context graph loaded.
                    </small>
                  </span>
                </div>

                <div className="cyber-notification-item">
                  <i className="red" />
                  <span>
                    <strong>Threat channel armed</strong>
                    <small>Detection threshold: 0.67</small>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="cyber-security-chip">
          <ShieldCheck size={14} />
          <span>GNN / 0.67</span>
        </div>
      </motion.div>
    </header>
  );
}

export default Topbar;
