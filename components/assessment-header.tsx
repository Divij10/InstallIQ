import { CircleCheck } from "lucide-react";
import { DataModeBadge } from "./data-mode-badge";
export function AssessmentHeader({mode}:{mode:"local"|"hosted"}){return <header className="topbar"><div className="brandmark">IQ</div><div><h1>InstallIQ</h1><p>Pre-site intelligence</p></div><div className="header-right"><span className="connection"><CircleCheck size={13}/> MCP connected</span><DataModeBadge mode={mode}/></div></header>}
