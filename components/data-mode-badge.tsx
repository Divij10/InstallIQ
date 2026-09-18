import { Badge } from "./ui/badge";
export function DataModeBadge({mode}:{mode:"local"|"hosted"}){return <Badge className="mode live">{mode === "hosted" ? "Live Precisely data" : "Local Precisely data"}</Badge>}
