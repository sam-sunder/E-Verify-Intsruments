"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardText,
  FileText,
  Gauge,
  IdentificationCard,
  Layout,
  ListChecks,
  ShieldCheck,
  UsersThree,
  Clock,
} from "@phosphor-icons/react";
import type { UserRole } from "@/lib/api-client";

type NavItem = { label: string; icon: React.ElementType; href?: string; available?: boolean };

const common: NavItem[] = [
  { label: "Workspace", icon: Layout, href: "/" },
  { label: "Notifications", icon: Bell, href: "/notifications", available: true },
];

const roleItems: Record<UserRole, NavItem[]> = {
  BUSINESS_OWNER: [
    { label: "Instruments", icon: Gauge, href: "/instruments", available: true },
    { label: "Applications", icon: FileText, href: "/applications", available: true },
    { label: "Certificates", icon: ShieldCheck, href: "/certificates", available: true },
  ],
  OFFICER: [
    { label: "Assignments", icon: ListChecks, href: "/officer/assignments", available: true },
    { label: "Certificates", icon: ShieldCheck, href: "/certificates", available: true },
  ],
  ADMINISTRATOR: [
    { label: "Users", icon: UsersThree, href: "/admin/users", available: true },
    { label: "Review queue", icon: FileText, href: "/admin/applications", available: true },
    { label: "Instruments", icon: Gauge, href: "/admin/instruments", available: true },
    { label: "Certificates", icon: ShieldCheck, href: "/admin/certificates", available: true },
    { label: "Compliance", icon: IdentificationCard, href: "/admin/compliance", available: true },
    { label: "Audit Logs", icon: Clock, href: "/admin/audit", available: true },
  ],
};

export function Navigation({ role, open, onClose }: { role: UserRole; open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <aside className={`app-rail ${open ? "open" : ""}`} aria-label="Primary navigation">
        <div className="rail-brand">
          <div className="brand-lockup">
            <span className="brand-mark">eV</span>
            <span>
              <span className="brand-name">e-VerifyMet</span>
              <span className="brand-subtitle">Legal metrology</span>
            </span>
          </div>
        </div>
        <nav className="rail-nav">
          <span className="nav-section-label">Workspace</span>
          {[...common, ...roleItems[role]].map((item, index) => {
            const Icon = item.icon;
            const isItemActive = item.href ? (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) : false;

            return item.href && item.available !== false ? (
              <Link
                key={`${item.label}-${index}`}
                href={item.href}
                className={`nav-item ${isItemActive ? "active" : ""}`}
                onClick={onClose}
              >
                <span className="nav-icon"><Icon size={19} weight="regular" /></span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ) : (
              <span key={`${item.label}-${index}`} className="nav-item disabled" aria-disabled="true">
                <span className="nav-icon"><Icon size={19} weight="regular" /></span>
                <span className="nav-label">{item.label}</span>
                <span className="nav-soon">Soon</span>
              </span>
            );
          })}
        </nav>
        <div className="rail-footer">
          <div className="rail-context">
            <strong>Operational shell</strong>
            Regulated instrument lifecycle workflows under Indian Legal Metrology.
          </div>
        </div>
      </aside>
      {open ? <button className="mobile-scrim" aria-label="Close navigation" onClick={onClose} /> : null}
    </>
  );
}