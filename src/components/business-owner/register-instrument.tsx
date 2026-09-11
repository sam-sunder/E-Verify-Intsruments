"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Gauge } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { Field, TextInput, TextArea } from "@/components/ui/field";
import { ErrorState } from "@/components/ui/states";
import { api } from "@/lib/api-client";

const COMMON_INSTRUMENT_TYPES = [
  "Non-Automatic Weighing Instrument (NAWI)",
  "Automatic Weighing Instrument (AWI)",
  "Electronic Precision Balance",
  "Commercial Counter Scale",
  "Weighbridge / Truck Scale",
  "Fuel Dispenser (Petrol / Diesel)",
  "LPG Flow Meter / Dispenser",
  "Automatic Gravimetric Filling Instrument",
  "Continuous Totalising Automatic Weighing Instrument (Belt Weigher)",
  "Material Measure of Length",
  "Capacity Measure (Volumetric)",
];

const COMMON_CATEGORIES = [
  "Commercial & Retail",
  "Industrial & Heavy Manufacturing",
  "Petroleum & Hydrocarbons",
  "Pharmaceutical & Laboratory",
  "Logistics, Freight & Warehousing",
  "Agriculture & Mandi Operations",
  "Gold & Precious Metals",
];

export function RegisterInstrument() {
  const router = useRouter();

  const [instrumentType, setInstrumentType] = useState("");
  const [customType, setCustomType] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("kg");
  const [currentLocation, setCurrentLocation] = useState("");
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const resolvedType = instrumentType === "OTHER" ? customType.trim() : instrumentType;
    const resolvedCategory = category === "OTHER" ? customCategory.trim() : category;

    if (!resolvedType) {
      setError("Please specify an instrument type.");
      return;
    }
    if (!resolvedCategory) {
      setError("Please select or specify a category.");
      return;
    }
    if (!serialNumber.trim()) {
      setError("Serial number is required.");
      return;
    }

    setLoading(true);
    try {
      const created = await api.createInstrument({
        instrumentType: resolvedType,
        category: resolvedCategory,
        manufacturer: manufacturer.trim() || undefined,
        model: model.trim() || undefined,
        serialNumber: serialNumber.trim(),
        registrationNumber: registrationNumber.trim() || undefined,
        capacity: capacity.trim() || undefined,
        unitOfMeasure: unitOfMeasure.trim() || undefined,
        currentLocation: currentLocation.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      router.push(`/instruments/${encodeURIComponent(created.publicInstrumentId)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to register instrument");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="breadcrumb-nav">
        <Link href="/">Workspace</Link>
        <span>/</span>
        <Link href="/instruments">Instruments</Link>
        <span>/</span>
        <span>Register</span>
      </div>

      <div className="heading-row">
        <div>
          <div className="eyebrow">Equipment Registry</div>
          <h1 className="page-heading">Register Regulated Instrument</h1>
          <p className="page-lede">
            Enter technical specifications and physical location to register a weighing or measuring instrument under Indian Legal Metrology rules.
          </p>
        </div>
        <div>
          <Link href="/instruments">
            <Button variant="secondary" icon={<ArrowLeft size={16} />}>Back to Instruments</Button>
          </Link>
        </div>
      </div>

      {error ? <div style={{ marginBottom: 18 }}><ErrorState message={error} /></div> : null}

      <Panel>
        <PanelHeader>
          <div>
            <h2 className="section-heading">Instrument Specifications</h2>
            <p className="field-hint">All equipment requires accurate model and serial identification for physical stamping.</p>
          </div>
          <span className="status-badge status-info">New Registration</span>
        </PanelHeader>

        <PanelBody>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <Field label="Instrument Type" hint="Select classification under Legal Metrology (General) Rules.">
                <select
                  value={instrumentType}
                  onChange={(e) => setInstrumentType(e.target.value)}
                  required
                >
                  <option value="">Select an instrument type…</option>
                  {COMMON_INSTRUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="OTHER">Other / Custom Type…</option>
                </select>
              </Field>

              {instrumentType === "OTHER" ? (
                <Field label="Custom Instrument Type" hint="Specify the exact technical classification.">
                  <TextInput
                    type="text"
                    required
                    placeholder="e.g. Mass Flow Meter"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                  />
                </Field>
              ) : null}

              <Field label="Category" hint="Operating domain for compliance reporting.">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select a category…</option>
                  {COMMON_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="OTHER">Other / Custom Category…</option>
                </select>
              </Field>

              {category === "OTHER" ? (
                <Field label="Custom Category" hint="Specify industry or operational sector.">
                  <TextInput
                    type="text"
                    required
                    placeholder="e.g. Aerospace Calibration"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                </Field>
              ) : null}

              <Field label="Manufacturer / Make" hint="Name plate manufacturer.">
                <TextInput
                  type="text"
                  placeholder="e.g. Avery India, Essae-Teraoka, Mettler Toledo"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                />
              </Field>

              <Field label="Model Number / Designation">
                <TextInput
                  type="text"
                  placeholder="e.g. DS-852G, XP205"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </Field>

              <Field label="Serial Number" hint="Unique factory serial number stamped on instrument.">
                <TextInput
                  type="text"
                  required
                  placeholder="e.g. SN-984210"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </Field>

              <Field label="Registration / License Number (Optional)">
                <TextInput
                  type="text"
                  placeholder="e.g. REG-DL-2026-442"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                />
              </Field>

              <Field label="Rated Capacity" hint="Maximum measured capacity.">
                <TextInput
                  type="text"
                  placeholder="e.g. 30, 150, 5000"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </Field>

              <Field label="Unit of Measure">
                <select
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value)}
                >
                  <option value="kg">kg (Kilograms)</option>
                  <option value="g">g (Grams)</option>
                  <option value="mg">mg (Milligrams)</option>
                  <option value="t">t (Metric Tonnes)</option>
                  <option value="L">L (Litres)</option>
                  <option value="mL">mL (Millilitres)</option>
                  <option value="m">m (Metres)</option>
                </select>
              </Field>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Current Installation Location" hint="Physical premises where officer field inspection will take place.">
                  <TextInput
                    type="text"
                    placeholder="e.g. Counter 4, Retail Store, Sector 18, Gurugram, Haryana - 122002"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                  />
                </Field>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Remarks & Operational Notes" hint="Optional notes regarding instrument condition, usage environment, or access.">
                  <TextArea
                    rows={3}
                    placeholder="Enter any additional technical details or inspection notes…"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <div className="form-actions">
              <Link href="/instruments">
                <Button type="button" variant="quiet">Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" disabled={loading} icon={<CheckCircle size={16} />}>
                {loading ? "Registering Instrument…" : "Complete Registration"}
              </Button>
            </div>
          </form>
        </PanelBody>
      </Panel>
    </>
  );
}
