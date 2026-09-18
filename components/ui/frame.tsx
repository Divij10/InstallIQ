import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Frame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-frame", className)} {...props} />;
}
