interface ProfundrLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "light" | "dark";
  className?: string;
}

const SIZES = {
  xs: { fontSize: "13px" },
  sm: { fontSize: "16px" },
  md: { fontSize: "20px" },
  lg: { fontSize: "28px" },
};

const GRADIENTS = {
  light: "linear-gradient(135deg, #a5a5c0 0%, #d0d0e0 50%, #ffffff 100%)",
  dark: "linear-gradient(135deg, #1a1a2e 0%, #4a4a6a 50%, #8a8aa5 100%)",
};

export function ProfundrLogo({ size = "sm", variant = "light", className = "" }: ProfundrLogoProps) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex items-baseline select-none ${className}`}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: s.fontSize,
        fontWeight: 800,
        letterSpacing: "-0.05em",
        lineHeight: 1,
        background: GRADIENTS[variant],
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
      aria-label="profundr."
    >
      profundr<span style={{ marginLeft: "-0.15em" }}>.</span>
    </span>
  );
}
