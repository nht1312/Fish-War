const BAR_WIDTH_PX = 240;
const BAR_HEIGHT_PX = 14;
const MARKER_WIDTH_PX = 2;

const toPercent = (ratio: number) => `${Math.round(ratio * 100)}%`;

export interface MeterProps {
  readonly label: string;
  /** Filled fraction, 0..1. */
  readonly ratio: number;
  readonly color: string;
  /** Optional vertical marker, as a fraction 0..1. */
  readonly markerRatio?: number;
}

/** A labelled horizontal bar gauge. Display only. */
export function Meter({ label, ratio, color, markerRatio }: MeterProps) {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        color: "#fff",
        textShadow: "0 1px 2px #000",
      }}
    >
      <div style={{ fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
        style={{
          position: "relative",
          width: BAR_WIDTH_PX,
          height: BAR_HEIGHT_PX,
          background: "rgba(0, 0, 0, 0.5)",
          border: "1px solid #fff",
        }}
      >
        <div style={{ width: toPercent(ratio), height: "100%", background: color }} />
        {markerRatio !== undefined && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: toPercent(markerRatio),
              width: MARKER_WIDTH_PX,
              height: "100%",
              background: "#fff",
            }}
          />
        )}
      </div>
    </div>
  );
}
