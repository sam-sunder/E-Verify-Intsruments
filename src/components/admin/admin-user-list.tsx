"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  UsersThree,
  MagnifyingGlass,
  Plus,
  Funnel,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type UserProfile,
  type UserRole,
  type UserStatus,
  type PagedResult,
} from "@/lib/api-client";

function statusTone(status: UserStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "ACTIVE": return "success";
    case "INACTIVE": return "neutral";
    case "SUSPENDED": return "danger";
    default: return "neutral";
  }
}

export function AdminUserList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL");

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.listUsers({
          query: activeSearch,
          role: roleFilter === "ALL" ? undefined : roleFilter,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          page: pagination.page,
          pageSize: pagination.pageSize,
        });

        if (!active) return;
        setUsers(res.data);
        setPagination(res.pagination);
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load users");
        setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [activeSearch, roleFilter, statusFilter, pagination.page, pagination.pageSize]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  if (loading && users.length === 0) {
    return <LoadingState label="Fetching user directory…" />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        action={
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setError(null);
            }}
          >
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="heading-row">
        <div>
          <div className="eyebrow">Administrator Workspace</div>
          <h1 className="page-heading">User Management</h1>
          <p className="page-lede">
            Manage system access and roles for Business Owners and Legal Metrology Officers.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => window.location.href = "/admin/users/new"}>
          Create User
        </Button>
      </div>

      <Panel>
        <PanelHeader>
          <div style={{ display: "flex", gap: 16, alignItems: "center", width: "100%", justifyContent: "space-between" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, flex: 1, maxWidth: 400 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <MagnifyingGlass size={16} style={{ position: "absolute", left: 10, top: "calc(50% - 8px)", color: "var(--ink-muted)" }} />
                <input
                  type="text"
                  placeholder="Search by Name or Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: 32,
                    width: "100%",
                    height: "42px",
                    borderRadius: "2px",
                    border: "1px solid var(--border)",
                    fontSize: 14,
                  }}
                />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
            </form>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Funnel size={16} style={{ color: "var(--ink-muted)" }} />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as UserRole | "ALL");
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                style={{
                  padding: "8px 12px",
                  height: "42px",
                  borderRadius: "2px",
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  backgroundColor: "var(--surface)",
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="BUSINESS_OWNER">Business Owner</option>
                <option value="OFFICER">Officer</option>
                <option value="ADMINISTRATOR">Administrator</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as UserStatus | "ALL");
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                style={{
                  padding: "8px 12px",
                  height: "42px",
                  borderRadius: "2px",
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  backgroundColor: "var(--surface)",
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </PanelHeader>
        <PanelBody>
          {users.length === 0 ? (
            <EmptyState
              title="No users found"
              description="No system users match your current search or filter criteria."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Phone</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 600 }}>{user.fullName}</td>
                      <td>{user.email}</td>
                      <td>
                        <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{user.role.replaceAll("_", " ")}</span>
                      </td>
                      <td>
                        <StatusBadge value={user.status} tone={statusTone(user.status)} />
                      </td>
                      <td>{user.phone ?? "—"}</td>
                      <td>
                        <Link href={`/admin/users/${encodeURIComponent(user.id)}`}>
                          <span className="link-action" style={{ fontSize: 12 }}>Manage</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagination.totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 24 }}>
                  <Button
                    variant="secondary"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <span style={{ fontSize: 14, color: "var(--ink)" }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </PanelBody>
      </Panel>
    </>
  );
}
