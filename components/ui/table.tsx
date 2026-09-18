"use client";

import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TableProps = HTMLAttributes<HTMLTableElement> & { variant?: "card" };

export const Table = forwardRef<HTMLTableElement, TableProps>(({ className, variant, ...props }, ref) => (
  <div className="ui-table-viewport">
    <table ref={ref} className={cn("ui-table", variant === "card" && "ui-table-card", className)} {...props} />
  </div>
));
Table.displayName = "Table";

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("ui-table-header", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("ui-table-body", className)} {...props} />
));
TableBody.displayName = "TableBody";

export const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={cn("ui-table-footer", className)} {...props} />
));
TableFooter.displayName = "TableFooter";

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> { isBodyRow?: boolean }

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(({ className, isBodyRow, ...props }, ref) => (
  <tr ref={ref} className={cn("ui-table-row", isBodyRow && "ui-table-body-row", className)} {...props} />
));
TableRow.displayName = "TableRow";

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th ref={ref} scope="col" className={cn("ui-table-head", className)} {...props} />
));
TableHead.displayName = "TableHead";

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("ui-table-cell", className)} {...props} />
));
TableCell.displayName = "TableCell";
