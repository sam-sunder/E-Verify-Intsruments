"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowsClockwise,
  ArrowSquareOut,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Gauge,
  QrCode,
  ShieldCheck,
  Warning,
  WarningCircle,
  Download,
  FileText,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  api,
  type CertificateStatusHistoryItem,
  type DigitalCertificate,
} from "@/lib/api-client";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "EXPIRED":
    case "REVOKED":
    case "VOID":
      return "danger";
    case "SUSPENDED":
      return "warning";
    default:
      return "neutral";
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function getDaysRemaining(validTo: string, now: number): number {
  if (now === 0) return 0;
  return Math.ceil((new Date(validTo).getTime() - now) / (1000 * 60 * 60 * 24));
}

function PrintableCertificate({ certificate }: { certificate: DigitalCertificate }) {
  return (
    <div
      id="printable-certificate"
      style={{
        width: "800px",
        padding: "60px",
        background: "white",
        color: "black",
        fontFamily: "serif",
        position: "absolute",
        left: "-9999px",
        top: "0",
        border: "20px double #0070FF",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, color: "#0070FF", margin: 0 }}>e-VerifyMet</h1>
        <h2 style={{ fontSize: 24, margin: "10px 0", textTransform: "uppercase" }}>Certificate of Verification & Stamping</h2>
        <div style={{ fontSize: 14, fontStyle: "italic" }}>Issued under the Legal Metrology Act, 2009 & General Rules</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
        <div style={{ fontSize: 16 }}>
          <strong>Certificate No:</strong> {certificate.certificateNumber}
        </div>
        <div style={{ fontSize: 16 }}>
          <strong>Issue Date:</strong> {new Date(certificate.issuedAt).toLocaleDateString("en-IN")}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: 40 }}>
        <div style={{ display: "grid", gap: "12px" }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Instrument Type</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{certificate.instrument.instrumentType}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Serial Number</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace" }}>{certificate.instrument.serialNumber}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Public Instrument ID</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace" }}>{certificate.instrument.publicInstrumentId}</div>
          </div>
        </div>
        <div style={{ display: "grid", gap: "12px" }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Valid From</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{new Date(certificate.validFrom).toLocaleDateString("en-IN")}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Valid Until</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{new Date(certificate.validTo).toLocaleDateString("en-IN")}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Verification Outcome</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0070FF" }}>{certificate.verificationResult} (PASSED)</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 60 }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ borderTop: "1px solid black", width: "200px", paddingTop: 10, fontSize: 14 }}>
            <strong>Authorized Signatory</strong><br />
            Legal Metrology Department
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <QRCodeSVG value={certificate.publicVerificationUrl} size={120} />
          <div style={{ fontSize: 12, marginTop: 8, color: "#666" }}>Scan to verify certificate</div>
        </div>
      </div>

      <div style={{ marginTop: 40, textAlign: "center", fontSize: 10, color: "#999", borderTop: "1px solid #eee", paddingTop: 10 }}>
        This is a digitally generated certificate and is valid without a physical signature.
        Verification can be performed at the official e-VerifyMet portal.
      </div>
    </div>
  );
}

export function CertificateDetail({ certificateNumber }: { certificateNumber: string }) {
  const [certificate, setCertificate] = useState<DigitalCertificate | null>(null);
  const [history, setHistory] = useState<CertificateStatusHistoryItem[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(0);
  const qrRef = useRef<HTMLDivElement>(null);

  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [cert, hist, me] = await Promise.all([
          api.getCertificate(certificateNumber),
          api.getCertificateHistory(certificateNumber).catch(() => []),
          api.getMe().catch(() => null),
        ]);
        if (!active) return;
        setCertificate(cert);
        setHistory(hist);
        setUserRole(me?.role ?? null);
        setNow(Date.now());
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load certificate");
        setLoading(false);
      }
    }

    void fetchData();
    return () => {
      active = false;
    };
  }, [certificateNumber, reloadCounter]);

  function copyVerificationLink() {
    if (!certificate) return;
    const url = `${window.location.origin}/verify?certificateNumber=${encodeURIComponent(certificate.certificateNumber)}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  async function downloadQR() {
    if (!certificate || !qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 4; // High res
      canvas.height = img.height * 4;
      ctx.scale(4, 4);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `certificate-${certificate.certificateNumber}-qr.png`;
      downloadLink.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function downloadCertificate() {
    if (!certificate) return;
    const element = document.getElementById("printable-certificate");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "white",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`certificate-${certificate.certificateNumber}.pdf`);
    } catch (cause) {
      console.error("PDF Generation Error:", cause);
      alert("Failed to generate certificate PDF.");
    }
  }

  if (loading) return <LoadingState label="Loading digital certificate…" />;
  if (error && !certificate) {
    return (
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
            Retry
          </Button>
        }
      />
    );
  }
  if (!certificate) return <ErrorState message="Certificate not found" />;

  const daysRemaining = getDaysRemaining(certificate.validTo, now);
  const isExpired = certificate.status === "EXPIRED" || (now > 0 && daysRemaining < 0);
  const isDueSoon = !isExpired && now > 0 && daysRemaining <= 30;

  const reverificationUrl = `/applications/new?instrumentId=${encodeURIComponent(
    certificate.instrument.publicInstrumentId
  )}&type=RE_VERIFICATION&previousApplicationId=${encodeURIComponent(
    certificate.applicationNumber
  )}`;

  return (
    <>
      <div className="breadcrumb-nav">
        <Link href="/">Workspace</Link>
        <span>/</span>
        <Link href="/certificates">Certificates</Link>
        <span>/</span>
        <span>{certificate.certificateNumber}</span>
      </div>

      <div className="heading-row">
        <div>
          <div className="eyebrow">Digital Certificate of Verification</div>
          <h1 className="page-heading">{certificate.certificateNumber}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            <StatusBadge value={certificate.status} tone={statusTone(certificate.status)} />
            <span style={{ color: "var(--ink-muted)", fontSize: 13 }}>
              Instrument: <strong>{certificate.instrument.instrumentType}</strong> ({certificate.instrument.publicInstrumentId})
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="secondary" icon={copied ? <Check size={16} /> : <Copy size={16} />} onClick={copyVerificationLink}>
            {copied ? "Link Copied!" : "Copy Verification Link"}
          </Button>

          {(userRole === "BUSINESS_OWNER" || userRole === "ADMINISTRATOR") && (
            <>
              <Button variant="secondary" icon={<Download size={16} />} onClick={downloadQR}>
                Download QR
              </Button>
              <Button variant="primary" icon={<FileText size={16} />} onClick={downloadCertificate}>
                Download Certificate
              </Button>
              {isExpired || isDueSoon ? (
                <Link href={reverificationUrl}>
                  <Button variant="primary" icon={<ArrowsClockwise size={16} />}>
                    Apply for Re-Verification
                  </Button>
                </Link>
              ) : (
                <Link href={reverificationUrl}>
                  <Button variant="secondary" icon={<ArrowsClockwise size={16} />}>
                    Renew Stamping Early
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expiry Urgency Alert */}
      {isExpired ? (
        <div className="alert-banner alert-banner-danger">
          <div className="alert-banner-body">
            <strong>
              <Warning size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 6 }} />
              Certificate Expired: Legal Metrology Stamping is Overdue
            </strong>
            <p>
              This certificate expired on {formatDate(certificate.validTo)}. Operating an unstamped weighing or measuring instrument in commercial transactions is a regulatory violation.
            </p>
          </div>
          {(userRole === "BUSINESS_OWNER" || userRole === "ADMINISTRATOR") && (
            <Link href={reverificationUrl}>
              <Button variant="primary" icon={<ArrowsClockwise size={16} />}>
                Re-Verify Instrument Now
              </Button>
            </Link>
          )}
        </div>
      ) : isDueSoon ? (
        <div className="alert-banner alert-banner-warning">
          <div className="alert-banner-body">
            <strong>
              <Clock size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 6 }} />
              Expiring Soon: {daysRemaining} days remaining on certificate
            </strong>
            <p>
              Validity ends on {formatDate(certificate.validTo)}. To ensure uninterrupted commercial operations, initiate a re-verification application now.
            </p>
          </div>
          {(userRole === "BUSINESS_OWNER" || userRole === "ADMINISTRATOR") && (
            <Link href={reverificationUrl}>
              <Button variant="primary" icon={<ArrowsClockwise size={16} />}>
                Apply for Re-Verification
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="alert-banner alert-banner-success">
          <div className="alert-banner-body">
            <strong>
              <CheckCircle size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 6 }} />
              Active Legal Metrology Verification Stamp
            </strong>
            <p>
              Valid until {formatDate(certificate.validTo)} ({daysRemaining} days remaining). Physical tamper seals are active.
            </p>
          </div>
        </div>
      )}

      {/* Official Certificate Layout */}
      <div className="cert-frame" style={{ marginBottom: 28 }}>
        <div className="cert-header">
          <div className="cert-crest">
            <div className="cert-crest-mark">eV</div>
            <div>
              <h2 className="cert-title">Certificate of Verification & Stamping</h2>
              <div className="cert-subtitle">Legal Metrology Act, 2009 & General Rules</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="spec-label">Certificate No.</span>
            <strong style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--ink)" }}>
              {certificate.certificateNumber}
            </strong>
          </div>
        </div>

        {/* Certificate Specs Grid */}
        <div className="specs-grid" style={{ marginBottom: 24 }}>
          <div className="spec-box">
            <span className="spec-label">Issued At</span>
            <span className="spec-value">{formatDate(certificate.issuedAt)}</span>
          </div>
          <div className="spec-box">
            <span className="spec-label">Valid From</span>
            <span className="spec-value">{formatDate(certificate.validFrom)}</span>
          </div>
          <div className="spec-box">
            <span className="spec-label">Valid To</span>
            <span className="spec-value" style={{ color: isExpired ? "var(--danger)" : "var(--ink)" }}>
              {formatDate(certificate.validTo)}
            </span>
          </div>
          <div className="spec-box">
            <span className="spec-label">Verification Outcome</span>
            <span className="spec-value" style={{ color: "var(--success)" }}>
              {certificate.verificationResult} (PASSED)
            </span>
          </div>
        </div>

        <div className="shell-grid" style={{ marginBottom: 20 }}>
          {/* Instrument Particulars */}
          <div style={{ padding: 18, border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
            <span className="spec-label" style={{ marginBottom: 10, display: "block" }}>
              Regulated Instrument Particulars
            </span>
            <div className="shell-list">
              <div className="shell-list-row">
                <span>Digital Instrument ID</span>
                <strong style={{ fontFamily: "var(--font-mono)", color: "var(--accent-strong)" }}>
                  {certificate.instrument.publicInstrumentId}
                </strong>
              </div>
              <div className="shell-list-row">
                <span>Instrument Type</span>
                <strong>{certificate.instrument.instrumentType}</strong>
              </div>
              <div className="shell-list-row">
                <span>Category</span>
                <strong>{certificate.instrument.category}</strong>
              </div>
              <div className="shell-list-row">
                <span>Factory Serial Number</span>
                <strong style={{ fontFamily: "var(--font-mono)" }}>{certificate.instrument.serialNumber}</strong>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <Link href={`/instruments/${encodeURIComponent(certificate.instrument.publicInstrumentId)}`}>
                <span className="link-action" style={{ fontSize: 13 }}>
                  <Gauge size={14} /> Open Digital Instrument Passport
                </span>
              </Link>
            </div>
          </div>

          {/* Verification Authority & QR Block */}
          <div style={{ padding: 18, border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
            <span className="spec-label" style={{ marginBottom: 10, display: "block" }}>
              Verification Authority & Digital Proof
            </span>
            <div className="shell-list">
              <div className="shell-list-row">
                <span>Application Reference</span>
                <strong style={{ fontFamily: "var(--font-mono)" }}>{certificate.applicationNumber}</strong>
              </div>
              <div className="shell-list-row">
                <span>Verified By Officer</span>
                <strong>{certificate.issuedByName}</strong>
              </div>
              <div className="shell-list-row">
                <span>Verification Inspection Date</span>
                <strong style={{ fontFamily: "var(--font-mono)" }}>{formatDate(certificate.verificationDate)}</strong>
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "12px 14px", background: "var(--surface-soft)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div ref={qrRef} style={{ background: "white", padding: 4, borderRadius: 2 }}>
                  <QRCodeSVG value={certificate.publicVerificationUrl} size={48} />
                </div>
                <div>
                  <strong style={{ fontSize: 12, display: "block" }}>Public QR Verification</strong>
                  <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>Token-secured validation link</span>
                </div>
              </div>
              <Link href={`/verify?certificateNumber=${encodeURIComponent(certificate.certificateNumber)}`}>
                <Button variant="secondary" style={{ minHeight: 32, fontSize: 12 }} icon={<ArrowSquareOut size={14} />}>
                  Verify Publicly
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {certificate.documentHash ? (
          <div style={{ padding: "10px 14px", background: "var(--surface-soft)", borderRadius: "var(--radius-sm)", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-muted)", wordBreak: "break-all" }}>
            Document Hash: {certificate.documentHash}
          </div>
        ) : null}
      </div>

      {/* Status Transition History */}
      <Panel>
        <PanelHeader>
          <div>
            <h2 className="section-heading">Certificate Status History</h2>
            <p className="field-hint">Chronological lifecycle states recorded by Legal Metrology administration.</p>
          </div>
        </PanelHeader>
        <PanelBody>
          {history.length === 0 ? (
            <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>No status changes recorded.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Effective Date</th>
                    <th>Previous Status</th>
                    <th>New Status</th>
                    <th>Reason</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{formatDate(h.effectiveAt)}</td>
                      <td>{h.previousStatus ? <StatusBadge value={h.previousStatus} tone="neutral" /> : "—"}</td>
                      <td><StatusBadge value={h.newStatus} tone={statusTone(h.newStatus)} /></td>
                      <td>{h.reason || "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--ink-muted)" }}>{h.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PanelBody>
      </Panel>
      {certificate && <PrintableCertificate certificate={certificate} />}
    </>
  );
}
