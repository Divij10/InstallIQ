import { DataModeBadge } from "./data-mode-badge";
export function AssessmentHeader({mode}:{mode:"local"|"hosted"}){return <header className="topbar"><div className="brandmark">IQ</div><div><h1>InstallIQ</h1><p>Pre-Site Intelligence</p></div><div className="header-right"><span className="connection"><i/> MCP configured</span><DataModeBadge mode={mode}/></div></header>}
