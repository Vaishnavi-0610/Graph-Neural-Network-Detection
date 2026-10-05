import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPolicy({ onBack = () => window.dispatchEvent(new Event("open-settings")) }) {
  return (
    <article className="cyber-legal-page">
      <div className="cyber-legal-head">
        <div>
          <p className="cyber-kicker">DOCUMENT / PRIVACY</p>
          <h1>Privacy Policy</h1>
          <p>Last updated: 2 October 2026</p>
        </div>
        <ShieldCheck size={28} className="text-cyan-400" aria-hidden="true" />
      </div>

      <section>
        <h2>1. Scope</h2>
        <p>
          This application is an academic and defensive cybersecurity research
          interface for graph-based network intrusion detection.
        </p>
      </section>

      <section>
        <h2>2. Data processed</h2>
        <p>
          Network-flow records submitted for detection or enterprise evaluation
          are processed by the configured backend inference service. The UI may
          also store non-sensitive interface preferences in browser storage.
        </p>
      </section>

      <section>
        <h2>3. Tracking</h2>
        <p>
          The application does not require advertising cookies. UTM parameters,
          when present in a URL, may be retained locally for attribution/debugging
          and are not sent to an advertising network by this interface.
        </p>
      </section>

      <section>
        <h2>4. Security</h2>
        <p>
          Production deployments should use HTTPS and keep credentials,
          API keys, model secrets, and other private configuration on the
          server rather than in client-side code.
        </p>
      </section>

      <section>
        <h2>5. Research limitations</h2>
        <p>
          Results shown by this interface are research outputs and should not
          be interpreted as a guarantee of detection performance on every
          enterprise environment.
        </p>
      </section>

      <button type="button" className="cyber-legal-back" onClick={onBack}>
        <ArrowLeft size={14} /> Back to Settings
      </button>
    </article>
  );
}
