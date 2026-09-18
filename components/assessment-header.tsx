import { DataModeBadge } from "./data-mode-badge";
export function AssessmentHeader({mode}:{mode:"local"|"hosted"}){return <header className="topbar"><div className="brandmark">IQ</div><h1>InstallIQ</h1><div className="header-right"><DataModeBadge mode={mode}/></div></header>}
