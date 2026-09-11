"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Power,
  CheckCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { api, type UserProfile, type UserRole, type UserStatus } from "@/lib/api-client";
import { useSession } from "@/lib/auth/session-provider";

function statusTone(status: UserStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "ACTIVE": return "success";
    case "INACTIVE": return "neutral";
    case "SUSPENDED": return "danger";
    default: return "neutral";
  }
}

export function AdminUserDetails({ userId }: { userId: string }) {
  const { user: sessionUser, loading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "BUSINESS_OWNER" as UserRole,
    phone: "",
  });

  useEffect(() => {
    if (sessionLoading || !sessionUser) return;

    async function loadData() {
      setLoading(true);
      try {
        const u = await api.getUser(userId);
        setUser(u);
        setFormData({
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          phone: u.phone ?? "",
        });
        setLoading(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Failed to load user profile");
        setLoading(false);
      }
    }
    void loadData();
  }, [userId, sessionLoading, sessionUser]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const updated = await api.updateUser(userId, {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        phone: formData.phone || null,
      });
      setUser(updated);
      alert("User profile updated successfully");
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(action: "activate" | "deactivate") {
    try {
      if (action === "activate") await api.activateUser(userId);
      else await api.deactivateUser(userId);

      const updated = await api.getUser(userId);
      setUser(updated);
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : "Status update failed");
    }
  }

  if (sessionLoading || loading) return <LoadingState label="Fetching user profile…" />;
  if (error) return <ErrorState message={error} action={<Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>} />;
  if (!user) return <EmptyState title="User not found" description="The requested user profile could not be located." />;

  return (
    <>
      <div className="heading-row">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/users">
            <Button variant="quiet" icon={<ArrowLeft size={16} />} />
          </Link>
          <div>
            <div className="eyebrow">User Management</div>
            <h1 className="page-heading">{user.fullName}</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {user.status === "ACTIVE" ? (
            <Button variant="secondary" onClick={() => handleStatusChange("deactivate")} disabled={isSaving} icon={<Power size={16} />}>
              Deactivate Account
            </Button>
          ) : (
            <Button variant="primary" onClick={() => handleStatusChange("activate")} disabled={isSaving} icon={<Power size={16} />}>
              Activate Account
            </Button>
          )}
        </div>
      </div>

      <div className="shell-grid">
        <div style={{ display: "grid", gap: 24, maxWidth: 800 }}>
          <Panel>
            <PanelHeader>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <h2 className="section-heading">Profile Details</h2>
                <StatusBadge value={user.status} tone={statusTone(user.status)} />
              </div>
            </PanelHeader>
            <PanelBody>
              <div style={{ display: "grid", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label className="field-label">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      style={{
                        padding: "10px 12px",
                        height: "42px",
                        borderRadius: "2px",
                        border: "1px solid var(--border)",
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label className="field-label">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        padding: "10px 12px",
                        height: "42px",
                        borderRadius: "2px",
                        border: "1px solid var(--border)",
                        fontSize: 14,
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label className="field-label">User Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      style={{
                        padding: "8px 12px",
                        height: "42px",
                        borderRadius: "2px",
                        border: "1px solid var(--border)",
                        fontSize: 14,
                        backgroundColor: "var(--surface)",
                      }}
                    >
                      <option value="BUSINESS_OWNER">Business Owner</option>
                      <option value="OFFICER">Officer</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label className="field-label">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        padding: "10px 12px",
                        height: "42px",
                        borderRadius: "2px",
                        border: "1px solid var(--border)",
                        fontSize: 14,
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    icon={<CheckCircle size={16} />}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Access Control</h2>
            </PanelHeader>
            <PanelBody>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "var(--surface-soft)", borderRadius: "var(--radius-sm)" }}>
                <ShieldCheck size={20} color="var(--accent)" />
                <div>
                  <strong style={{ display: "block", fontSize: 14 }}>Authorized Access</strong>
                  <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                    User is granted permissions associated with the {user.role.replaceAll("_", " ")} role.
                  </span>
                </div>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  );
}
