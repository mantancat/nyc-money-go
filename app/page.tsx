"use client";

import React, { useMemo, useState } from "react";

type FilingStatus = "single";
type SourceLink = { label: string; href: string };
type BudgetNode = { label: string; weight: number; sources: SourceLink[]; children?: BudgetNode[] };
type Category = { id: string; label: string; weight: number; sources: SourceLink[]; children?: BudgetNode[] };

type RingItem = { label: string; value: number; color: string };

const SOURCES = {
  nycTaxInstructions: {
    label: "NY State IT-201 Instructions (2025, NYC rate schedule)",
    href: "https://www.tax.ny.gov/forms/current-forms/it/it201i.htm",
  },
  nycWithholding2026: {
    label: "NY Tax Dept – 2026 withholding update (NYC rates unchanged)",
    href: "https://www.tax.ny.gov/bus/wt/rate.htm",
  },
  iboBudget100: {
    label: "NYC IBO – NYC’s Budget in $100 (FY2026 Adopted Budget)",
    href: "https://a860-gpp.nyc.gov/downloads/765376507?locale=en",
  },
  nycSchoolsFunding: {
    label: "NYC Public Schools – Funding Our Schools (FY2026)",
    href: "https://www.schools.nyc.gov/about-us/funding/funding-our-schools",
  },
  nycExpenseBudgetDataset: {
    label: "NYC Open Data – Expense Budget (FY2026 PS/OTPS)",
    href: "https://data.cityofnewyork.us/City-Government/Expense-Budget/mwzb-yiwb",
  },
};

const DEFAULTS = { filingStatus: "single" as FilingStatus, nyStandardDeduction: 8000 };

const CATEGORIES: Category[] = [
  {
    id: "education",
    label: "Education",
    weight: 29.71,
    sources: [SOURCES.iboBudget100],
    children: [
      { label: "K-12 schools & instruction", weight: 16.6, sources: [SOURCES.nycSchoolsFunding] },
      { label: "School operations", weight: 5.4, sources: [SOURCES.nycSchoolsFunding] },
      { label: "Early childhood birth-to-five services", weight: 2.2, sources: [SOURCES.nycSchoolsFunding] },
      { label: "Superintendents & field offices", weight: 0.347, sources: [SOURCES.nycSchoolsFunding] },
      { label: "Central administrative offices", weight: 0.176, sources: [SOURCES.nycSchoolsFunding] },
      { label: "Employee benefits & pension", weight: 8.5, sources: [SOURCES.nycSchoolsFunding] },
      { label: "Debt payments", weight: 3.8, sources: [SOURCES.nycSchoolsFunding] },
      { label: "State-mandated payments to charter schools", weight: 3.4, sources: [SOURCES.nycSchoolsFunding] },
      { label: "Non-public & contract schools (special education)", weight: 2.3, sources: [SOURCES.nycSchoolsFunding] },
    ],
  },
  {
    id: "human_services",
    label: "Human Services",
    weight: 16.37,
    sources: [SOURCES.iboBudget100],
    children: [
      { label: "Department of Social Services", weight: 10.17, sources: [SOURCES.iboBudget100] },
      { label: "Department of Homeless Services", weight: 3.02, sources: [SOURCES.iboBudget100] },
      { label: "Administration for Children's Services", weight: 2.67, sources: [SOURCES.iboBudget100] },
      { label: "Department for the Aging", weight: 0.51, sources: [SOURCES.iboBudget100] },
    ],
  },
  {
    id: "misc",
    label: "Miscellaneous",
    weight: 13.18,
    sources: [SOURCES.iboBudget100],
    children: [
      { label: "General city operations", weight: 60, sources: [SOURCES.iboBudget100] },
      { label: "Other central expenses", weight: 40, sources: [SOURCES.iboBudget100] },
    ],
  },
  {
    id: "public_safety",
    label: "Public Safety & Judicial",
    weight: 10.11,
    sources: [SOURCES.iboBudget100],
    children: [
      { label: "Police Department (NYPD)", weight: 5.33, sources: [SOURCES.iboBudget100] },
      { label: "Fire Department (FDNY)", weight: 2.23, sources: [SOURCES.iboBudget100] },
      { label: "Department of Correction", weight: 1.03, sources: [SOURCES.iboBudget100] },
      { label: "Office of Criminal Justice", weight: 0.74, sources: [SOURCES.iboBudget100] },
      { label: "District Attorneys", weight: 0.78, sources: [SOURCES.iboBudget100] },
    ],
  },
  { id: "pensions", label: "City Employee Pensions", weight: 8.9, sources: [SOURCES.iboBudget100], children: [{ label: "Pension obligations", weight: 100, sources: [SOURCES.iboBudget100] }] },
  { id: "general", label: "General Government", weight: 5.48, sources: [SOURCES.iboBudget100], children: [{ label: "Citywide administration", weight: 100, sources: [SOURCES.iboBudget100] }] },
  { id: "debt", label: "Debt Service", weight: 4.14, sources: [SOURCES.iboBudget100], children: [{ label: "Debt service payments", weight: 100, sources: [SOURCES.iboBudget100] }] },
  { id: "health", label: "Health", weight: 3.49, sources: [SOURCES.iboBudget100], children: [{ label: "Dept. of Health & Mental Hygiene", weight: 2.07, sources: [SOURCES.iboBudget100] }, { label: "NYC Health + Hospitals", weight: 1.42, sources: [SOURCES.iboBudget100] }] },
  { id: "env", label: "Environmental Protection", weight: 3.18, sources: [SOURCES.iboBudget100], children: [{ label: "Department of Environmental Protection", weight: 2.95, sources: [SOURCES.iboBudget100] }, { label: "Department of Sanitation", weight: 0.23, sources: [SOURCES.iboBudget100] }] },
  { id: "housing", label: "Housing", weight: 1.56, sources: [SOURCES.iboBudget100], children: [{ label: "Department of Housing Preservation and Development", weight: 1, sources: [SOURCES.iboBudget100] }] },
  { id: "cuny", label: "CUNY Community Colleges", weight: 1.32, sources: [SOURCES.iboBudget100], children: [{ label: "CUNY Community Colleges", weight: 100, sources: [SOURCES.iboBudget100] }] },
  { id: "transport", label: "Transportation Services", weight: 1.28, sources: [SOURCES.iboBudget100], children: [{ label: "Department of Transportation", weight: 1, sources: [SOURCES.iboBudget100] }] },
  { id: "parks", label: "Parks, Recreation & Cultural Affairs", weight: 0.84, sources: [SOURCES.iboBudget100], children: [{ label: "Department of Parks and Recreation", weight: 0.48, sources: [SOURCES.iboBudget100] }, { label: "Department of Cultural Affairs", weight: 0.36, sources: [SOURCES.iboBudget100] }] },
  { id: "libraries", label: "Libraries", weight: 0.44, sources: [SOURCES.iboBudget100], children: [{ label: "New York Public Library", weight: 0.19, sources: [SOURCES.iboBudget100] }, { label: "Queens Public Library", weight: 0.15, sources: [SOURCES.iboBudget100] }, { label: "Brooklyn Public Library", weight: 0.14, sources: [SOURCES.iboBudget100] }, { label: "NYPL - Research Libraries", weight: 0.04, sources: [SOURCES.iboBudget100] }] },
];

const AGENCY_PS_OTPS_2026: Record<string, { ps: number; otps: number }> = {
  "Department of Education": { ps: 58402434309, otps: 39643851243 },
  "Department of Social Services": { ps: 2748915402, otps: 32684557554 },
  "Department of Homeless Services": { ps: 523086975, otps: 11197132998 },
  "Administration for Children's Services": { ps: 1733570121, otps: 6628423473 },
  "Department for the Aging": { ps: 96423321, otps: 1554244095 },
  "Police Department (NYPD)": { ps: 16160055798, otps: 1338739377 },
  "Fire Department (FDNY)": { ps: 6934852854, otps: 779237136 },
  "Department of Correction": { ps: 2645794158, otps: 503530194 },
  "Office of Criminal Justice": { ps: 28076946, otps: 2308248162 },
  "District Attorneys": { ps: 1476172611, otps: 237302334 },
  "Dept. of Health & Mental Hygiene": { ps: 1819970700, otps: 4876412106 },
  "NYC Health + Hospitals": { ps: 0, otps: 9467810511 },
  "Department of Environmental Protection": { ps: 2095926414, otps: 2936155707 },
  "Department of Sanitation": { ps: 3533466981, otps: 2308884801 },
  "Department of Housing Preservation and Development": { ps: 697357011, otps: 5282007012 },
  "Department of Transportation": { ps: 1924959591, otps: 2423010015 },
  "Department of Parks and Recreation": { ps: 1396634487, otps: 457519365 },
  "Department of Cultural Affairs": { ps: 19416540, otps: 742181394 },
  "New York Public Library": { ps: 0, otps: 534517401 },
  "Queens Public Library": { ps: 0, otps: 420585606 },
  "Brooklyn Public Library": { ps: 0, otps: 406523961 },
  "NYPL - Research Libraries": { ps: 0, otps: 104985330 },
};

const SUBCATEGORY_MANDATES: Record<string, string> = {
  "Department of Housing Preservation and Development": "Preserves and creates affordable housing, enforces housing standards, and supports neighborhood investment.",
  "Department of Homeless Services": "Provides shelter intake, housing placement, and support services for people experiencing homelessness.",
  "Administration for Children's Services": "Protects child safety and oversees child welfare, prevention, and family support services.",
  "Department of Social Services": "Administers public assistance, SNAP support, and family/adult services through DSS agencies.",
  "Department for the Aging": "Funds and coordinates services that support older adults in NYC.",
  "K-12 schools & instruction": "Core classroom teaching and learning services in NYC public schools.",
  "School operations": "School-level operations, facilities support, and administrative services.",
};

function formatUSD(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function formatUSD2(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}
function clamp0(n: number) {
  return Math.max(0, n);
}

function computeNYCResidentTaxRateSchedule(nycTaxableIncome: number): number {
  const x = nycTaxableIncome;
  if (x <= 12000) return 0.03078 * x;
  if (x <= 25000) return 369 + 0.03762 * (x - 12000);
  if (x <= 50000) return 858 + 0.03819 * (x - 25000);
  return 1813 + 0.03876 * (x - 50000);
}

function computeNYCIncomeTax(params: { income: number; filingStatus: FilingStatus; nyStandardDeduction: number }) {
  const nycTaxableIncome = clamp0(params.income - params.nyStandardDeduction);
  const nycTax = computeNYCResidentTaxRateSchedule(nycTaxableIncome);
  return { nycTaxableIncome, nycTax };
}

function normalizeWeights<T extends { weight: number }>(items: T[]) {
  const sum = items.reduce((a, b) => a + b.weight, 0);
  return { sum, items: items.map((it) => ({ ...it, norm: sum ? it.weight / sum : 0 })) };
}

function pathForArc(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number) {
  const toXY = (r: number, a: number) => {
    const rad = (Math.PI / 180) * a;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const p1 = toXY(rOuter, start);
  const p2 = toXY(rOuter, end);
  const p3 = toXY(rInner, end);
  const p4 = toXY(rInner, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
}

function Donut({ items, centerLabel, onSliceClick, activeLabel }: { items: RingItem[]; centerLabel: string; onSliceClick?: (label: string) => void; activeLabel?: string | null }) {
  const size = 420;
  const outer = 180;
  const inner = 128;
  const cx = size / 2;
  const cy = size / 2;
  const total = Math.max(1, items.reduce((a, b) => a + Math.max(0, b.value), 0));
  let acc = -90;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="nyc-donut" aria-label={centerLabel}>
      {items.map((it) => {
        const angle = (Math.max(0, it.value) / total) * 360;
        const start = acc;
        const end = acc + angle;
        const mid = start + angle / 2;
        acc = end;
        const rad = (Math.PI / 180) * mid;
        const tx = cx + ((outer + inner) / 2) * Math.cos(rad);
        const ty = cy + ((outer + inner) / 2) * Math.sin(rad);
        const pct = (it.value / total) * 100;

        return (
          <g key={it.label}>
            <path
              d={pathForArc(cx, cy, outer, inner, start, end)}
              fill={it.color}
              stroke="#f6f4ee"
              strokeWidth={1}
              onClick={onSliceClick ? () => onSliceClick(it.label) : undefined}
              className={`nyc-slice ${onSliceClick ? "clickable" : ""} ${activeLabel ? (activeLabel === it.label ? "active" : "dim") : ""}`}
            />
            {pct >= 4 && (
              <text x={tx} y={ty} className="nyc-pct" textAnchor="middle" dominantBaseline="middle">
                {pct.toFixed(0)}%
              </text>
            )}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={inner - 2} fill="#f6f4ee" />
      <text x={cx} y={cy} className="nyc-center" textAnchor="middle" dominantBaseline="middle">
        {centerLabel}
      </text>
    </svg>
  );
}

export default function Page() {
  const [income, setIncome] = useState(0);
  const [unlockedLevel, setUnlockedLevel] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryLabel, setSelectedSubcategoryLabel] = useState<string | null>(null);
  const [hoveredSubcategoryLabel, setHoveredSubcategoryLabel] = useState<string | null>(null);

  const { nycTax } = useMemo(
    () => computeNYCIncomeTax({ income, filingStatus: DEFAULTS.filingStatus, nyStandardDeduction: DEFAULTS.nyStandardDeduction }),
    [income]
  );

  const categoryAlloc = useMemo(() => {
    const { items } = normalizeWeights(CATEGORIES);
    return items.map((c) => ({ ...c, dollars: nycTax * c.norm }));
  }, [nycTax]);

  const selectedCategory = useMemo(() => categoryAlloc.find((c) => c.id === selectedCategoryId) ?? null, [categoryAlloc, selectedCategoryId]);

  const selectedSubcats = useMemo(() => {
    if (!selectedCategory?.children?.length) return [];
    const categoryChildren = selectedCategory.children.map((child) => {
      if (child.children?.length) return child;
      const split = AGENCY_PS_OTPS_2026[child.label] ?? (selectedCategory.id === "education" ? AGENCY_PS_OTPS_2026["Department of Education"] : null);
      if (!split) return child;
      return {
        ...child,
        children: [
          { label: "Personal Services", weight: split.ps, sources: [SOURCES.nycExpenseBudgetDataset] },
          { label: "Other Than Personal Services", weight: split.otps, sources: [SOURCES.nycExpenseBudgetDataset] },
        ],
      };
    });

    const { items } = normalizeWeights(categoryChildren);
    return items.map((s) => ({ ...s, dollars: (selectedCategory.dollars ?? 0) * s.norm }));
  }, [selectedCategory]);

  const selectedSubcategory = useMemo(
    () => selectedSubcats.find((s) => s.label === selectedSubcategoryLabel) ?? null,
    [selectedSubcats, selectedSubcategoryLabel]
  );
  const infoSubcategory = hoveredSubcategoryLabel ? selectedSubcats.find((s) => s.label === hoveredSubcategoryLabel) ?? selectedSubcategory : selectedSubcategory;

  const infoPSOTPS = useMemo(() => {
    if (!infoSubcategory?.children?.length) return null;
    const { items } = normalizeWeights(infoSubcategory.children);
    const ps = items.find((x) => x.label === "Personal Services")?.norm ?? 0;
    const otps = items.find((x) => x.label === "Other Than Personal Services")?.norm ?? 0;
    return { ps, otps, psDollars: (infoSubcategory.dollars ?? 0) * ps, otpsDollars: (infoSubcategory.dollars ?? 0) * otps };
  }, [infoSubcategory]);

  const colors = ["#1f1f1f", "#4aa7d8", "#e36a2e", "#6c7a89", "#9c7a3f", "#4a6b60", "#b8695b", "#7a6f9f", "#9bb3a6", "#b5a27f", "#546b9a", "#a96f86"];

  const categoryItems: RingItem[] = categoryAlloc.map((c, i) => ({ label: c.label, value: c.dollars, color: colors[i % colors.length] }));
  const subItems: RingItem[] = selectedSubcats.map((s, i) => ({ label: s.label, value: s.dollars, color: colors[i % colors.length] }));

  const hasIncome = income > 0;

  return (
    <div className="nyc-wrap">
      <header className="nyc-header">
        <div className="nyc-brand">Where does my money go?</div>
        <div className="nyc-sub">NEW YORK CITY EDITION</div>
      </header>

      <main className="nyc-main">
        <section className="nyc-topCards">
          <div className="nyc-card" onClick={() => setUnlockedLevel(2)} role="button" tabIndex={0}>
            <div className="nyc-kicker">INCOME</div>
            <div className="nyc-big">
              <span>$</span>
              <input className="nyc-incomeInput" value={income.toLocaleString("en-US")} onChange={(e) => setIncome(Number(e.target.value.replace(/[^\d]/g, "")) || 0)} />
              <span className="nyc-unit">/ Year</span>
            </div>
            <div className="nyc-note">Enter income to unlock tax and details.</div>
          </div>

          {unlockedLevel >= 1 && (
            <div className="nyc-card">
              <div className="nyc-kicker">NYC INCOME TAX</div>
              <div className="nyc-big">{formatUSD2(nycTax)}</div>
              <div className="nyc-note">Estimated annual NYC resident income tax.</div>
            </div>
          )}
        </section>

        <section className="nyc-card">
          <div className="nyc-kicker">DETAILS</div>
          {!hasIncome && <div className="nyc-small">Enter your income above to see your NYC tax allocation.</div>}

          {hasIncome && unlockedLevel >= 1 && !selectedCategory && (
            <>
              <div className="nyc-small">Your NYC income tax allocated across categories</div>
              <div className="nyc-note">Click a category in the legend or donut to drill down.</div>
              <div className="nyc-viz">
                <Donut
                  items={categoryItems}
                  centerLabel="NYC Budget"
                  onSliceClick={(label) => {
                    const c = categoryAlloc.find((x) => x.label === label);
                    if (!c) return;
                    setSelectedCategoryId(c.id);
                    setSelectedSubcategoryLabel(null);
                    setHoveredSubcategoryLabel(null);
                  }}
                />
                <div className="nyc-legend">
                  {categoryItems
                    .slice()
                    .sort((a, b) => b.value - a.value)
                    .map((it) => (
                      <button
                        key={it.label}
                        className="nyc-legendRow"
                        onClick={() => {
                          const c = categoryAlloc.find((x) => x.label === it.label);
                          if (!c) return;
                          setSelectedCategoryId(c.id);
                          setSelectedSubcategoryLabel(null);
                          setHoveredSubcategoryLabel(null);
                        }}
                      >
                        <span className="nyc-swatch" style={{ background: it.color }} />
                        <span>{it.label}</span>
                        <span>{formatUSD(it.value)} • {((it.value / Math.max(1, nycTax)) * 100).toFixed(1)}%</span>
                      </button>
                    ))}
                </div>
              </div>
            </>
          )}

          {hasIncome && selectedCategory && (
            <>
              {selectedSubcategory ? (
                <div className="nyc-spend">You spend <b>{formatUSD(selectedCategory.dollars ?? 0)}</b> on <b>{selectedCategory.label}</b>. Within that, <b>{formatUSD(selectedSubcategory.dollars ?? 0)}</b> on <b>{selectedSubcategory.label}</b>.</div>
              ) : (
                <div className="nyc-spend">You spend <b>{formatUSD(selectedCategory.dollars ?? 0)}</b> on <b>{selectedCategory.label}</b>.</div>
              )}
              <div className="nyc-note">Click on category to drill into the details.</div>

              {infoSubcategory && (
                <div className="nyc-hoverCard">
                  <div className="nyc-hoverTitle">{infoSubcategory.label}</div>
                  <div className="nyc-hoverText">{SUBCATEGORY_MANDATES[infoSubcategory.label] ?? "Official mission/mandate wording is not yet mapped for this line item."}</div>
                  {infoPSOTPS && (
                    <div className="nyc-hoverText">
                      Personal Services: <b>{formatUSD(infoPSOTPS.psDollars)}</b> ({(infoPSOTPS.ps * 100).toFixed(1)}%)<br />
                      Other Than Personal Services: <b>{formatUSD(infoPSOTPS.otpsDollars)}</b> ({(infoPSOTPS.otps * 100).toFixed(1)}%)
                    </div>
                  )}
                </div>
              )}

              <div className="nyc-viz">
                <Donut items={subItems} centerLabel={selectedCategory.label.toUpperCase()} onSliceClick={(label) => setSelectedSubcategoryLabel(label)} activeLabel={hoveredSubcategoryLabel || selectedSubcategoryLabel} />
                <div className="nyc-legend">
                  {subItems
                    .slice()
                    .sort((a, b) => b.value - a.value)
                    .map((it) => {
                      const pct = (it.value / Math.max(1, selectedCategory.dollars ?? 1)) * 100;
                      return (
                        <button
                          key={it.label}
                          className={`nyc-legendRow ${selectedSubcategoryLabel === it.label ? "active" : ""}`}
                          onMouseEnter={() => setHoveredSubcategoryLabel(it.label)}
                          onMouseLeave={() => setHoveredSubcategoryLabel(null)}
                          onClick={() => setSelectedSubcategoryLabel(it.label)}
                        >
                          <span className="nyc-swatch" style={{ background: it.color }} />
                          <span>{it.label}</span>
                          <span>{formatUSD(it.value)} • {pct.toFixed(1)}%</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </section>

        <section className="nyc-card">
          <div className="nyc-kicker">SOURCES</div>
          <ul className="nyc-sources">
            <li><a href={SOURCES.nycTaxInstructions.href} target="_blank" rel="noreferrer">{SOURCES.nycTaxInstructions.label}</a></li>
            <li><a href={SOURCES.nycWithholding2026.href} target="_blank" rel="noreferrer">{SOURCES.nycWithholding2026.label}</a></li>
            <li><a href={SOURCES.iboBudget100.href} target="_blank" rel="noreferrer">{SOURCES.iboBudget100.label}</a></li>
            <li><a href={SOURCES.nycSchoolsFunding.href} target="_blank" rel="noreferrer">{SOURCES.nycSchoolsFunding.label}</a></li>
            <li><a href={SOURCES.nycExpenseBudgetDataset.href} target="_blank" rel="noreferrer">{SOURCES.nycExpenseBudgetDataset.label}</a></li>
          </ul>
          <div className="nyc-fine">2026 note: NYC rate schedule is unchanged; using the 2025 IT-201 NYC rate schedule (latest published).</div>
          <div className="nyc-fine">This allocates your NYC income tax proportionally across NYC spending categories (a simplification because revenues are pooled).</div>
        </section>
      </main>

      <style jsx>{`
        .nyc-wrap { min-height: 100vh; background: #f6f4ee; color: #111; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
        .nyc-header { padding: 20px 24px 14px; text-align: center; border-bottom: 1px solid #dedad2; }
        .nyc-brand { font-size: 44px; letter-spacing: 0.08em; text-transform: uppercase; }
        .nyc-sub { margin-top: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #7a7a7a; }
        .nyc-main { padding: 18px; display: grid; gap: 14px; }
        .nyc-topCards { display: grid; grid-template-columns: repeat(2, minmax(280px, 1fr)); gap: 14px; }
        .nyc-card { background: #fbfaf6; border: 1px solid #dedad2; border-radius: 16px; padding: 16px; }
        .nyc-kicker { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #7a7a7a; margin-bottom: 10px; }
        .nyc-big { font-size: 36px; line-height: 1; display: flex; align-items: baseline; gap: 8px; }
        .nyc-incomeInput { width: 220px; border: none; outline: none; background: transparent; color: inherit; font: inherit; padding: 0; margin: 0; }
        .nyc-unit { font-size: 28px; color: #7a7a7a; }
        .nyc-note { margin-top: 10px; font-size: 12px; color: #7a7a7a; }
        .nyc-small { margin-top: 4px; font-size: 14px; color: #333; }
        .nyc-viz { margin-top: 10px; display: grid; grid-template-columns: 440px 1fr; gap: 18px; align-items: start; }
        .nyc-donut { overflow: visible; }
        .nyc-center { font-size: 22px; letter-spacing: 0.06em; text-transform: uppercase; fill: #333; }
        .nyc-pct { font-size: 12px; font-weight: 700; fill: rgba(255,255,255,0.95); }
        .nyc-slice.clickable { cursor: pointer; }
        .nyc-slice.dim { opacity: 0.35; }
        .nyc-slice.active { opacity: 1; }
        .nyc-legend { display: flex; flex-direction: column; gap: 6px; }
        .nyc-legendRow { border: 1px solid #dedad2; background: transparent; border-radius: 10px; padding: 8px 10px; display: grid; grid-template-columns: 10px 1fr auto; gap: 8px; align-items: center; text-align: left; cursor: pointer; }
        .nyc-legendRow.active, .nyc-legendRow:hover { background: rgba(0,0,0,0.03); }
        .nyc-swatch { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
        .nyc-spend { margin-top: 2px; font-size: 33px; line-height: 1.2; }
        .nyc-hoverCard { margin-top: 10px; border: 1px solid #dedad2; border-radius: 12px; padding: 10px 12px; background: #fffdf8; }
        .nyc-hoverTitle { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
        .nyc-hoverText { font-size: 12px; line-height: 1.4; color: #333; }
        .nyc-sources { margin: 0; padding-left: 18px; display: grid; gap: 6px; font-size: 12px; }
        .nyc-fine { margin-top: 8px; font-size: 11px; color: #7a7a7a; }
        a { color: #2a2a2a; text-decoration: none; border-bottom: 1px dotted rgba(0,0,0,0.25); }
        @media (max-width: 1100px) {
          .nyc-topCards { grid-template-columns: 1fr; }
          .nyc-viz { grid-template-columns: 1fr; }
          .nyc-big { font-size: 32px; }
          .nyc-unit { font-size: 20px; }
          .nyc-spend { font-size: 23px; }
        }
      `}</style>
    </div>
  );
}
