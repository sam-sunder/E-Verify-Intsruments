"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CaretLeft,
  CaretRight,
  Check,
  Checks,
  Clock,
  Gauge,
  ShieldCheck,
  Warning,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type NotificationItem,
  type Pagination,
} from "@/lib/api-client";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 15, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchNotifications() {
      try {
        const res = await api.listNotifications({
          unreadOnly,
          page,
          pageSize: 15,
        });
        if (!active) return;
        setNotifications(res.data);
        setPagination(res.pagination);
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load notifications");
        setLoading(false);
      }
    }

    void fetchNotifications();
    return () => {
      active = false;
    };
  }, [unreadOnly, page, reloadCounter]);

  async function handleMarkRead(id: string) {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item))
      );
    } catch {
      // ignore
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() }))
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <div className="breadcrumb-nav">
        <Link href="/">Workspace</Link>
        <span>/</span>
        <span>Notifications</span>
      </div>

      <div className="heading-row">
        <div>
          <div className="eyebrow">Operational Alerts</div>
          <h1 className="page-heading">Notifications</h1>
          <p className="page-lede">
            Stay updated on Legal Metrology certificate expirations, application statuses, and officer verification schedules.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button
            variant="secondary"
            disabled={markingAll || unreadCount === 0}
            onClick={() => void handleMarkAllRead()}
            icon={<Checks size={16} />}
          >
            {markingAll ? "Marking…" : "Mark All as Read"}
          </Button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <Button
            variant={unreadOnly ? "secondary" : "primary"}
            onClick={() => {
              setLoading(true);
              setPage(1);
              setUnreadOnly(false);
            }}
          >
            All Notifications
          </Button>
          <Button
            variant={unreadOnly ? "primary" : "secondary"}
            onClick={() => {
              setLoading(true);
              setPage(1);
              setUnreadOnly(true);
            }}
          >
            Unread Only {unreadCount > 0 ? `(${unreadCount})` : ""}
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorState
          message={error}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setLoading(true);
                setError(null);
                setReloadCounter((c) => c + 1);
              }}
            >
              Try Again
            </Button>
          }
        />
      ) : null}

      <Panel>
        <PanelHeader>
          <div>
            <h2 className="section-heading">Inbox</h2>
            <p className="field-hint">
              {unreadOnly ? `Showing unread alerts` : `Showing all alerts`} ({pagination.totalItems} total)
            </p>
          </div>
        </PanelHeader>
        <PanelBody>
          {loading ? (
            <LoadingState label="Loading alerts…" />
          ) : notifications.length === 0 ? (
            <EmptyState
              title="No notifications"
              description={unreadOnly ? "You have no unread notifications right now." : "You do not have any notifications."}
            />
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-card ${notif.isRead ? "" : "unread"}`}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flex: 1 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "var(--radius-sm)",
                        background: notif.type === "CERTIFICATE_EXPIRY" ? "var(--warning-soft)" : "var(--info-soft)",
                        color: notif.type === "CERTIFICATE_EXPIRY" ? "var(--warning)" : "var(--info)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {notif.type === "CERTIFICATE_EXPIRY" ? <Warning size={18} /> : <Bell size={18} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div className="notif-title">{notif.title}</div>
                      <div className="notif-message">{notif.message}</div>
                      <div className="notif-time">{formatDate(notif.createdAt)}</div>

                      {/* Associated Links */}
                      <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12 }}>
                        {notif.instrument ? (
                          <Link
                            href={`/instruments/${encodeURIComponent(notif.instrument.digitalInstrumentId)}`}
                            className="link-action"
                          >
                            <Gauge size={13} /> Instrument: {notif.instrument.digitalInstrumentId}
                          </Link>
                        ) : null}

                        {notif.certificate ? (
                          <Link
                            href={`/certificates/${encodeURIComponent(notif.certificate.certificateNumber)}`}
                            className="link-action"
                          >
                            <ShieldCheck size={13} /> Certificate: {notif.certificate.certificateNumber}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {!notif.isRead ? (
                    <Button
                      variant="quiet"
                      style={{ fontSize: 12, minHeight: 30, padding: "4px 8px" }}
                      onClick={() => void handleMarkRead(notif.id)}
                      icon={<Check size={13} />}
                    >
                      Mark read
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 ? (
            <div className="pagination-bar">
              <div>
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} items total)
              </div>
              <div className="pagination-controls">
                <Button
                  variant="secondary"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => {
                    setLoading(true);
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  icon={<CaretLeft size={14} />}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => {
                    setLoading(true);
                    setPage((p) => p + 1);
                  }}
                  icon={<CaretRight size={14} />}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </PanelBody>
      </Panel>
    </>
  );
}
