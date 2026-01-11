const iconMap = {
  spark: (
    <path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3z" />
  ),
  shield: (
    <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
  ),
  bank: (
    <>
      <path d="M3 10l9-6 9 6v2H3v-2z" />
      <path d="M5 12v7M9 12v7M15 12v7M19 12v7" />
      <path d="M3 19h18" />
    </>
  ),
  bolt: <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
      <path d="M14 2v6h6" />
    </>
  ),
  briefcase: (
    <>
      <path d="M8 6V4h8v2" />
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
      <path d="M3 12h18" />
    </>
  ),
  handshake: (
    <>
      <path d="M7 12l-2 2a3 3 0 0 0 4 4l2-2" />
      <path d="M17 12l2 2a3 3 0 0 1-4 4l-2-2" />
      <path d="M9 14l3-3a2 2 0 0 1 3 0l3 3" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="8" cy="7" rx="4" ry="2.5" />
      <path d="M4 7v5c0 1.4 1.8 2.5 4 2.5s4-1.1 4-2.5V7" />
      <path d="M12 10c0 1.4 1.8 2.5 4 2.5s4-1.1 4-2.5-1.8-2.5-4-2.5" />
      <path d="M12 10v5c0 1.4 1.8 2.5 4 2.5s4-1.1 4-2.5v-5" />
    </>
  ),
  building: (
    <>
      <path d="M4 20V6l8-3 8 3v14" />
      <path d="M9 10h2M9 14h2M13 10h2M13 14h2" />
      <path d="M3 20h18" />
    </>
  ),
  trend: (
    <>
      <path d="M3 16l6-6 4 4 7-7" />
      <path d="M14 7h7v7" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M10 19V9" />
      <path d="M16 19V12" />
      <path d="M22 19H2" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7h15a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V8a1 1 0 0 1 1-1z" />
      <path d="M16 11h4v4h-4z" />
    </>
  ),
  market: (
    <>
      <path d="M4 10l2-5h12l2 5" />
      <path d="M4 10v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M8 20v-6h8v6" />
    </>
  ),
  portfolio: (
    <>
      <path d="M4 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
      <path d="M9 7V5a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V22a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3l9 16H3l9-16z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  stack: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M21 12l-9 5-9-5" />
      <path d="M21 17l-9 5-9-5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  "arrow-down": (
    <>
      <path d="M12 5v14" />
      <path d="M19 12l-7 7-7-7" />
    </>
  ),
  "arrow-up": (
    <>
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </>
  ),
  mail: (
    <>
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M22 8l-10 6L2 8" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
};

const Icon = ({ name, className = "" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {iconMap[name] || iconMap.spark}
    </svg>
  );
};

export default Icon;
