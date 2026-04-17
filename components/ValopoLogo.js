// Valopo Logo - "The Pulse V"
// Usage: <ValopoLogo size={40} /> or <ValopoLogo size={16} /> for favicon

export default function ValopoLogo({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="64" height="64" rx="16" fill="url(#valopo-grad)" />
      {/* Ghost V shape for depth */}
      <path
        d="M16 14 L32 50 L48 14"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.15"
      />
      {/* Main pulse line that forms the V */}
      <polyline
        points="10,32 18,32 24,14 32,50 40,14 46,32 54,32"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Accent dot */}
      <circle cx="54" cy="32" r="2.5" fill="#60a5fa" />
      <defs>
        <linearGradient id="valopo-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
    </svg>
  );
}
