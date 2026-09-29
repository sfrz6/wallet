/**
 * Mahfazati logo mark: a wallet with an upward savings trend, in the brand
 * color. Used in place of a plain text wordmark. Adapts to light and dark via
 * the theme's --color-primary token.
 */
export function Logo({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Mahfazati"
      className={className}
    >
      <rect x="0" y="0" width="40" height="40" rx="11" fill="var(--color-primary)" />
      {/* Wallet body */}
      <rect x="8" y="12.5" width="24" height="17" rx="3.6" fill="#ffffff" />
      {/* Wallet top band */}
      <path
        d="M8 16.1c0-2 1.6-3.6 3.6-3.6h16.8c2 0 3.6 1.6 3.6 3.6v1.1H8z"
        fill="var(--color-primary-fg)"
        opacity="0.18"
      />
      {/* Upward savings trend */}
      <path
        d="M12.5 25.5 18 20.4l3.7 2.8 6.3-6"
        stroke="var(--color-primary)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24.6 17.2h4v4"
        stroke="var(--color-primary)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
