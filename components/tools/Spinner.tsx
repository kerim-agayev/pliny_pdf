export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.3)",
        borderTopColor: "white",
        display: "inline-block",
        animation: "ppspin 0.8s linear infinite",
      }}
    />
  );
}
