export type TraceType = "observation" | "decision" | "skill_started" | "tool_called" | "tool_completed" | "skill_completed" | "warning" | "stopped" | "completed";
export type AgentTraceEvent = { id: string; timestamp: string; phase: string; type: TraceType; skillName?: string; toolName?: string; message: string; durationMs?: number; status?: string };
let traceCount = 0;
export function trace(input: Omit<AgentTraceEvent, "id" | "timestamp">): AgentTraceEvent { return { id: `trace-${++traceCount}`, timestamp: new Date().toISOString(), ...input }; }
