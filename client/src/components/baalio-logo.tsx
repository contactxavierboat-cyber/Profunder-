interface BaalioLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: { fontSize: 12, tmSize: "5px", stroke: 1.4 },
  sm: { fontSize: 14, tmSize: "6px", stroke: 1.6 },
  md: { fontSize: 18, tmSize: "7px", stroke: 2 },
  lg: { fontSize: 24, tmSize: "9px", stroke: 2.4 },
};

function Eyes({ h, stroke }: { h: number; stroke: number }) {
  const eyeRy = h * 0.32;
  const eyeRx = eyeRy * 0.85;
  const pupilR = eyeRy * 0.38;
  const w = eyeRx * 4 + stroke * 2 + eyeRx * 0.3;
  const cy = h / 2;
  const cx1 = eyeRx + stroke;
  const cx2 = w - eyeRx - stroke;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: "inline-block", verticalAlign: "baseline", marginBottom: "-0.15em" }}
    >
      <ellipse cx={cx1} cy={cy} rx={eyeRx} ry={eyeRy} fill="none" stroke="#1a1a2e" strokeWidth={stroke} />
      <circle cx={cx1} cy={cy} r={pupilR} fill="#1a1a2e" />
      <ellipse cx={cx2} cy={cy} rx={eyeRx} ry={eyeRy} fill="none" stroke="#1a1a2e" strokeWidth={stroke} />
      <circle cx={cx2} cy={cy} r={pupilR} fill="#1a1a2e" />
    </svg>
  );
}

export function BaalioLogo({ size = "sm", className = "" }: BaalioLogoProps) {
  const s = SIZES[size];
  const h = s.fontSize;
  return (
    <span
      className={`inline-flex items-baseline select-none ${className}`}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 900,
        fontSize: s.fontSize + "px",
        letterSpacing: "-0.04em",
        lineHeight: 1,
        textTransform: "lowercase",
        color: "#1a1a2e",
      }}
      aria-label="baalio"
    >
      <span>b</span>
      <Eyes h={h} stroke={s.stroke} />
      <span style={{ color: "#4a4a6a" }}>lio</span>
      <span style={{ fontSize: s.tmSize, verticalAlign: "super", marginLeft: "1px", color: "#4a4a6a", fontWeight: 400 }}>®</span>
    </span>
  );
}
