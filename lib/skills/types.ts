import type { Evidence } from "@/lib/domain/evidence";
import type { AgentTraceEvent } from "@/lib/domain/trace";
export type SkillResult<T> = { data: T; evidence: Evidence[]; warnings: string[]; trace: AgentTraceEvent[] };
export interface Skill<I, O> { id: string; description: string; run(input: I): Promise<SkillResult<O>>; }
