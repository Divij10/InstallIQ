export function DataModeBadge({mode}:{mode:"local"|"hosted"}){return <span className="mode live">{mode === "hosted" ? "LIVE PRECISELY DATA" : "LOCAL PRECISELY DATA"}</span>}
