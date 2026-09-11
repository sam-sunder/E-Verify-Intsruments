import type { ReactNode } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`panel ${className}`}>{children}</section>; }
export function PanelHeader({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`panel-header ${className}`}>{children}</div>; }
export function PanelBody({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`panel-body ${className}`}>{children}</div>; }