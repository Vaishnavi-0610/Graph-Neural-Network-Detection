import { useEffect, useState } from "react";

const STORAGE_KEY = "gnn_privacy_notice_v2";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "accepted");
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // Continue even when browser storage is unavailable.
    }
    setVisible(false);
  };

  const openPrivacy = () => {
    window.dispatchEvent(new Event("open-privacy"));
  };

  if (!visible) return null;

  return (
    <aside className="cyber-cookie-banner" aria-label="Privacy notice">
      <div className="cyber-cookie-content">
        <div className="cyber-cookie-icon" aria-hidden="true">
          <span />
        </div>

        <div className="cyber-cookie-copy">
          <div className="cyber-cookie-title-row">
            <p className="cyber-cookie-title">PRIVACY NOTICE</p>
            <span className="cyber-cookie-status">LOCAL STORAGE ONLY</span>
          </div>

          <p className="cyber-cookie-text">
            This interface uses essential browser storage for preferences.
            No advertising or tracking cookies are required.
          </p>
        </div>
      </div>

      <div className="cyber-cookie-actions">
        <button
          type="button"
          className="cyber-cookie-policy"
          onClick={openPrivacy}
        >
          Privacy Policy
        </button>

        <button
          type="button"
          className="cyber-cookie-continue"
          onClick={dismiss}
        >
          Continue
        </button>
      </div>
    </aside>
  );
}
