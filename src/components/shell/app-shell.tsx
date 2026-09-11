"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { List, SignOut, UserCircle } from "@phosphor-icons/react";
import { Button, IconButton } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useSession } from "@/lib/auth/session-provider";
import { Navigation } from "./navigation";

export function AppShell({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, error, logout } = useSession();
  const [navOpen, setNavOpen] = useState(false);
  if (loading) return <LoadingState label="Loading secure workspace" />;
  if (!user) return <main className="content-wrap"><ErrorState message={error ?? "Sign in is required to access the workspace."} action={<Button variant="secondary" onClick={() => router.push("/login")}>Open sign in</Button>} /></main>;
  return <div className="app-frame"><Navigation role={user.role} open={navOpen} onClose={() => setNavOpen(false)} /><div className="app-main"><header className="topbar"><div className="brand-lockup mobile-only"><IconButton label="Open navigation" onClick={() => setNavOpen(true)}><List size={21} /></IconButton><span className="brand-mark">eV</span></div><div className="topbar-context"><span className="eyebrow">Secure workspace</span><span style={{ marginLeft: 12, color: "var(--ink-muted)", fontSize: 13 }}>e-VerifyMet operations</span></div><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span className="status-badge status-info"><UserCircle size={14} /> {user.role.replaceAll("_", " ")}</span><Button variant="quiet" icon={<SignOut size={17} />} onClick={() => void logout()}>Sign out</Button></div></header><main className="content-wrap">{children ?? <ShellHome userName={user.fullName} role={user.role} />}</main></div></div>;
}

export function ShellHome({ userName, role }: { userName: string; role: string }) {
  return <><div className="shell-intro"><div><div className="eyebrow">Authenticated workspace</div><h1 className="page-heading">Good to see you, {userName.split(" ")[0]}.</h1><p className="page-lede">A clear operating surface for regulated instruments, evidence, and decisions.</p></div><div className="shell-note"><strong>{role.replaceAll("_", " ")}</strong>Navigation is tailored to your authorization scope. Future modules will become available here without changing the shell.</div></div><div className="shell-grid"><section className="panel"><div className="panel-header"><div><h2 className="section-heading">Workspace status</h2><p className="field-hint">The foundation is ready for operational modules.</p></div><span className="status-badge status-success">Connected</span></div><div className="panel-body"><EmptyState title="No active work area" description="Choose an available area from the navigation when a workflow is ready for your role." /></div></section><section className="panel-flat"><div className="panel-body"><h2 className="section-heading">Trust by design</h2><div className="shell-list" style={{ marginTop: 18 }}><div className="shell-list-row"><strong>Access</strong><span>Role-scoped</span></div><div className="shell-list-row"><strong>Records</strong><span>Audit-ready</span></div><div className="shell-list-row"><strong>Devices</strong><span>Mobile-first</span></div></div></div></section></div></>;
}