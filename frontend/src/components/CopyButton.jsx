import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      className="cyber-copy-button"
      aria-label={`${label}: ${value}`}
      title={copied ? "Copied" : label}
      onClick={copy}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}
