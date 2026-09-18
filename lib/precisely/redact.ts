const secret = /(?:authorization|api[_-]?key|api[_-]?secret|token|password)/i;
export function redact(value: unknown): unknown { if (Array.isArray(value)) return value.map(redact); if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, secret.test(k) ? "[REDACTED]" : redact(v)])); return value; }
