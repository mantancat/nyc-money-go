"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type FilingStatus = "single" | "married_joint" | "married_separate" | "head_household";

type SourceLink = { label: string; href: string };

type Category = {
  id: string;
  label: string;
  weight: number;
  accent?: "warm" | "cool";
  sources: SourceLink[];
  children?: { label: string; weight: number; sources: SourceLink[] }[];
};

const SOURCES = {
  nycTaxInstructions: {
    label: "NY State IT-201 Instructions (2025, NYC tax rate schedule)",
    href: "https://www.tax.ny.gov/forms/current-forms/it/it201i.htm",
  },
  nycTaxTables: {
    label: "NY Tax Dept – NYC tax tables (latest published year list)",
    href: "https://www.tax.ny.gov/pit/file/tax-tables/",
  },
  nycWithholding2026: {
    label: "NY Tax Dept – 2026 withholding update (NYC rates unchanged)",
    href: "https://www.tax.ny.gov/bus/wt/rate.htm",
  },
  iboBudget100: {
    label: "NYC IBO – NYC’s Budget in $100 (Oct 2025, FY2026 Adopted Budget)",
    href: "https://a860-gpp.nyc.gov/downloads/765376507?locale=en",
  },
  nycFinancialPlanExpense: {
    label: "NYC OMB – FY2026 Adopted Budget Financial Plan Expense (agency/department detail)",
    href: "https://a860-gpp.nyc.gov/downloads/sn00b323r?locale=en",
  },
  nycSchoolsFunding: {
    label: "NYC Public Schools – Funding Our Schools (FY2026)",
    href: "https://www.schools.nyc.gov/about-us/funding/funding-our-schools",
  },
};

const DEFAULTS = {
  filingStatus: "single" as FilingStatus,
  nyStandardDeduction: 8000,
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

function computeNYCResidentTaxRateSchedule(nycTaxableIncome: number, filingStatus: FilingStatus): number {
  if (filingStatus !== "single") {
    // fallback: treat as single; label in UI if you expose status selector
  }

  const x = nycTaxableIncome;

  // NYC Single (IT-201 2025 NYC rate schedule):
  // <= 12,000: 3.078%
  // 12,001–25,000: 369 + 3.762% over 12,000
  // 25,001–50,000: 858 + 3.819% over 25,000
  // > 50,000: 1,813 + 3.876% over 50,000
  //
  // NOTE: NYC tax table applies if NYC taxable income < $65,000, but V1 uses rate schedule for all.
  if (x <= 12000) return 0.03078 * x;
  if (x <= 25000) return 369 + 0.03762 * (x - 12000);
  if (x <= 50000) return 858 + 0.03819 * (x - 25000);
  return 1813 + 0.03876 * (x - 50000);
}

function computeNYCIncomeTax(params: { income: number; filingStatus: FilingStatus; nyStandardDeduction: number }) {
  const nycTaxableIncome = clamp0(params.income - params.nyStandardDeduction);
  const nycTax = computeNYCResidentTaxRateSchedule(nycTaxableIncome, params.filingStatus);
  return { nycTaxableIncome, nycTax };
}

const CATEGORIES: Category[] = [
  {
    id: "education",
    label: "Education",
    weight: 29.71,
    accent: "cool",
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
    accent: "warm",
    sources: [SOURCES.iboBudget100],
    children: [
      { label: "Department of Social Services", weight: 10.17, sources: [SOURCES.iboBudget100] },
      { label: "Department of Homeless Services", weight: 3.02, sources: [SOURCES.iboBudget100] },
      { label: "Administration for Children's Services", weight: 2.67, sources: [SOURCES.iboBudget100] },
      { label: "Department for the Aging", weight: 0.51, sources: [SOURCES.iboBudget100] },
    ],
  },
  {
    id: "miscellaneous",
    label: "Miscellaneous",
    weight: 13.18,
    sources: [SOURCES.iboBudget100, SOURCES.nycFinancialPlanExpense],
    children: [
      { label: "Personal service", weight: 10060.656, sources: [SOURCES.nycFinancialPlanExpense] },
      { label: "Other than personal service", weight: 4268.15, sources: [SOURCES.nycFinancialPlanExpense] },
    ],
  },
  {
    id: "public_safety",
    label: "Public Safety & Judicial",
    weight: 10.11,
    accent: "warm",
    sources: [SOURCES.iboBudget100],
    children: [
      { label: "Police Department (NYPD)", weight: 5.33, sources: [SOURCES.iboBudget100] },
      { label: "Fire Department (FDNY)", weight: 2.23, sources: [SOURCES.iboBudget100] },
      { label: "Department of Correction", weight: 1.03, sources: [SOURCES.iboBudget100] },
      { label: "Office of Criminal Justice", weight: 0.74, sources: [SOURCES.iboBudget100] },
      { label: "District Attorneys", weight: 0.51, sources: [SOURCES.iboBudget100] },
      { label: "Department of Probation", weight: 0.1, sources: [SOURCES.iboBudget100] },
      { label: "Emergency Management", weight: 0.07, sources: [SOURCES.iboBudget100] },
      { label: "Taxi & Limousine Commission", weight: 0.05, sources: [SOURCES.iboBudget100] },
      { label: "Special Narcotics Prosecutor", weight: 0.03, sources: [SOURCES.iboBudget100] },
      { label: "Civilian Complaint Review Board", weight: 0.02, sources: [SOURCES.iboBudget100] },
      // Board of Correction and Public Administrators are listed as 0.00 in IBO.
    ],
  },
  {
    id: "pensions",
    label: "City Employee Pensions",
    weight: 8.9,
    sources: [SOURCES.iboBudget100, SOURCES.nycFinancialPlanExpense],
    children: [
      { label: "Salary and wages", weight: 10233.669, sources: [SOURCES.nycFinancialPlanExpense] },
      { label: "Other fringe benefits", weight: 40.257, sources: [SOURCES.nycFinancialPlanExpense] },
      { label: "Other than personal service", weight: 2.157, sources: [SOURCES.nycFinancialPlanExpense] },
    ],
  },
  {
    id: "general_government",
    label: "General Government",
    weight: 5.48,
    sources: [SOURCES.iboBudget100],
    children: [
      { label: "Department of Citywide Administrative Services", weight: 1.51, sources: [SOURCES.iboBudget100] },
      { label: "Department of Youth and Community Development", weight: 1.29, sources: [SOURCES.iboBudget100] },
      { label: "Department of Information Technology & Telecommunications", weight: 0.69, sources: [SOURCES.iboBudget100] },
      { label: "Department of Finance", weight: 0.32, sources: [SOURCES.iboBudget100] },
      { label: "Department of Small Business Services", weight: 0.24, sources: [SOURCES.iboBudget100] },
      { label: "Law Department", weight: 0.24, sources: [SOURCES.iboBudget100] },
      { label: "Mayoralty", weight: 0.17, sources: [SOURCES.iboBudget100] },
      { label: "Department of Design and Construction", weight: 0.14, sources: [SOURCES.iboBudget100] },
      { label: "Board of Elections", weight: 0.12, sources: [SOURCES.iboBudget100] },
      { label: "Office of the Comptroller", weight: 0.11, sources: [SOURCES.iboBudget100] },
      { label: "Financial Information Services Agency", weight: 0.1, sources: [SOURCES.iboBudget100] },
      { label: "City Council", weight: 0.1, sources: [SOURCES.iboBudget100] },
      { label: "Campaign Finance Board", weight: 0.09, sources: [SOURCES.iboBudget100] },
      { label: "Office of Administrative Trials and Hearings", weight: 0.07, sources: [SOURCES.iboBudget100] },
      { label: "Department of Consumer Affairs", weight: 0.06, sources: [SOURCES.iboBudget100] },
      { label: "Department of City Planning", weight: 0.05, sources: [SOURCES.iboBudget100] },
      { label: "Department of Investigation", weight: 0.05, sources: [SOURCES.iboBudget100] },
      { label: "Other administrative agencies", weight: 0.1, sources: [SOURCES.iboBudget100] },
      { label: "Borough Presidents", weight: 0.03, sources: [SOURCES.iboBudget100] },
      { label: "Community Boards", weight: 0.02, sources: [SOURCES.iboBudget100] },
    ],
  },
  {
    id: "debt_service",
    label: "Debt Service",
    weight: 4.14,
    sources: [SOURCES.iboBudget100, SOURCES.nycFinancialPlanExpense],
    children: [
      { label: "City funds", weight: 4766.171, sources: [SOURCES.nycFinancialPlanExpense] },
      { label: "Federal - other", weight: 102.386, sources: [SOURCES.nycFinancialPlanExpense] },
      { label: "State", weight: 4.657, sources: [SOURCES.nycFinancialPlanExpense] },
      { label: "Other categorical", weight: 1.241, sources: [SOURCES.nycFinancialPlanExpense] },
    ],
  },
  {
    id: "health",
    label: "Health",
    weight: 3.49,
    sources: [SOURCES.iboBudget100],
    children: [
      { label: "Dept. of Health & Mental Hygiene", weight: 2.07, sources: [SOURCES.iboBudget100] },
      { label: "NYC Health + Hospitals", weight: 1.42, sources: [SOURCES.iboBudget100] },
    ],
  },
  {
    id: "environmental",
    label: "Environmental Protection",
    weight: 3.18,
    sources: [SOURCES.iboBudget100],
    children: [
      { label: "Department of Environmental Protection", weight: 2.95, sources: [SOURCES.iboBudget100] },
      { label: "Department of Sanitation", weight: 0.23, sources: [SOURCES.iboBudget100] },
    ],
  },
  {
    id: "housing",
    label: "Housing",
    weight: 1.56,
    sources: [SOURCES.iboBudget100],
    children: [
      { label: "New York City Housing Authority", weight: 0.92, sources: [SOURCES.iboBudget100] },
      { label: "Department of Housing Preservation and Development", weight: 0.64, sources: [SOURCES.iboBudget100] },
    ],
  },
  {
    id: "cuny",
    label: "CUNY Community Colleges",
    weight: 1.32,
    sources: [SOURCES.iboBudget100],
    children: [
      { label: "CUNY Community Colleges", weight: 1.22, sources: [SOURCES.iboBudget100] },
      { label: "CUNY Construction Fund", weight: 0.1, sources: [SOURCES.iboBudget100] },
    ],
  },
  {
    id: "transportation",
    label: "Transportation Services",
    weight: 1.28,
    sources: [SOURCES.iboBudget100],
    children: [
      { label: "Department of Transportation", weight: 0.93, sources: [SOURCES.iboBudget100] },
      { label: "Department of Records and Information Services", weight: 0.35, sources: [SOURCES.iboBudget100] },
    ],
  },
  {
    id: "parks_cultural",
    label: "Parks, Recreation & Cultural Affairs",
    weight: 0.84,
    sources: [SOURCES.iboBudget100],
    children: [
      { label: "Department of Parks and Recreation", weight: 0.48, sources: [SOURCES.iboBudget100] },
      { label: "Department of Cultural Affairs", weight: 0.36, sources: [SOURCES.iboBudget100] },
    ],
  },
  {
    id: "libraries",
    label: "Libraries",
    weight: 0.44,
    sources: [SOURCES.iboBudget100, SOURCES.nycFinancialPlanExpense],
    children: [
      { label: "New York Public Library", weight: 190.598, sources: [SOURCES.nycFinancialPlanExpense] },
      { label: "Queens Public Library", weight: 149.9, sources: [SOURCES.nycFinancialPlanExpense] },
      { label: "Brooklyn Public Library", weight: 144.775, sources: [SOURCES.nycFinancialPlanExpense] },
      { label: "NYPL - Research Libraries", weight: 37.867, sources: [SOURCES.nycFinancialPlanExpense] },
    ],
  },
];

function normalizeWeights<T extends { weight: number }>(items: T[]) {
  const sum = items.reduce((a, b) => a + b.weight, 0);
  return { sum, items: items.map((it) => ({ ...it, norm: sum ? it.weight / sum : 0 })) };
}

type RingItem = {
  label: string;
  value: number;
  color?: string;
  onClick?: () => void;
};

type Ring = {
  items: RingItem[];
  thickness: number;
  gap: number;
};

const RING_PADDING = 10;

type DonutSlice = {
  label: string;
  value: number;
  pct: number;
  color?: string;
  midX: number;
  midY: number;
  isRight: boolean;
};

function computeDonutSlices(items: RingItem[], size: number, thickness: number, startAngle = -90): DonutSlice[] {
  const total = Math.max(1, items.reduce((a, b) => a + Math.max(0, b.value), 0));
  const cx = size / 2;
  const cy = size / 2;
  const ringOuter = size / 2 - RING_PADDING;
  const ringMid = ringOuter - thickness / 2;
  let acc = 0;

  return items.map((it) => {
    const value = Math.max(0, it.value);
    const angle = (value / total) * 360;
    const start = startAngle + acc;
    const midAngle = start + angle / 2;
    acc += angle;
    const radians = (Math.PI / 180) * midAngle;
    return {
      label: it.label,
      value: it.value,
      pct: (value / total) * 100,
      color: it.color,
      midX: cx + ringMid * Math.cos(radians),
      midY: cy + ringMid * Math.sin(radians),
      isRight: Math.cos(radians) >= 0,
    };
  });
}

function Sunburst({
  rings,
  size = 280,
  startAngle = -90,
  centerLabel,
  showPercents = false,
  hoverRingIndex = null,
  onSliceHover,
  onSliceLeave,
  activeLabel,
}: {
  rings: Ring[];
  size?: number;
  startAngle?: number;
  centerLabel?: string;
  showPercents?: boolean;
  hoverRingIndex?: number | null;
  onSliceHover?: (info: { label: string; value: number; pct: number }) => void;
  onSliceLeave?: () => void;
  activeLabel?: string | null;
}) {
  const cx = size / 2;
  const cy = size / 2;

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const angleRad = (Math.PI / 180) * angleDeg;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  }

  function donutSegmentPath(
    cx: number,
    cy: number,
    rOuter: number,
    rInner: number,
    start: number,
    end: number
  ) {
    const p1 = polarToCartesian(cx, cy, rOuter, start);
    const p2 = polarToCartesian(cx, cy, rOuter, end);
    const p3 = polarToCartesian(cx, cy, rInner, end);
    const p4 = polarToCartesian(cx, cy, rInner, start);
    const large = end - start <= 180 ? 0 : 1;
    return [
      `M ${p1.x} ${p1.y}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y}`,
      "Z",
    ].join(" ");
  }

  const totalRadius = size / 2 - RING_PADDING;
  let currentOuter = totalRadius;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="sunburst">
      {rings.map((ring, ringIndex) => {
        const ringOuter = currentOuter;
        const ringInner = ringOuter - ring.thickness;
        currentOuter = ringInner - ring.gap;
        const total = Math.max(1, ring.items.reduce((a, b) => a + b.value, 0));
        let acc = 0;
        return (
          <g key={`ring-${ringIndex}`}>
            {ring.items.map((it, idx) => {
              const value = Math.max(0, it.value);
              const angle = (value / total) * 360;
              const start = startAngle + acc;
              const end = startAngle + acc + angle;
              const mid = start + angle / 2;
              const pct = (value / total) * 100;
              acc += angle;
              const ringMid = (ringOuter + ringInner) / 2;
              const labelPoint = polarToCartesian(cx, cy, ringMid, mid);

              return (
                <g key={`${it.label}-${idx}`}>
                  <path
                    d={donutSegmentPath(cx, cy, ringOuter, ringInner, start, end)}
                    fill={it.color ?? "rgba(0,0,0,0.2)"}
                    stroke="#f6f4ee"
                    strokeWidth={1}
                    onClick={it.onClick}
                    onMouseEnter={() => {
                      if (hoverRingIndex !== null && ringIndex === hoverRingIndex) {
                        onSliceHover?.({ label: it.label, value: it.value, pct });
                      }
                    }}
                    onMouseLeave={() => {
                      if (hoverRingIndex !== null && ringIndex === hoverRingIndex) {
                        onSliceLeave?.();
                      }
                    }}
                    className={`slice ${it.onClick ? "clickable" : ""} ${
                      activeLabel ? (activeLabel === it.label ? "active" : "dimmed") : ""
                    }`}
                  />
                  {showPercents && ringIndex === 0 && pct >= 4 && (
                    <text x={labelPoint.x} y={labelPoint.y} textAnchor="middle" className="slicePct">
                      {pct.toFixed(0)}%
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {centerLabel && (
        <g>
          <circle cx={cx} cy={cy} r={42} fill="#f6f4ee" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="sunCenter">
            {centerLabel}
          </text>
        </g>
      )}
    </svg>
  );
}

function RingWithLabelRails({
  items,
  centerLabel,
  onItemClick,
  size = 360,
  thickness = 26,
}: {
  items: RingItem[];
  centerLabel: string;
  onItemClick?: (label: string) => void;
  size?: number;
  thickness?: number;
}) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [lines, setLines] = useState<
    Array<{ label: string; x1: number; y1: number; x2: number; y2: number; isLeft: boolean; color?: string }>
  >([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const donutRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const slices = useMemo(() => computeDonutSlices(items, size, thickness), [items, size, thickness]);
  const leftItems = useMemo(
    () => slices.filter((s) => !s.isRight).sort((a, b) => a.midY - b.midY),
    [slices]
  );
  const rightItems = useMemo(
    () => slices.filter((s) => s.isRight).sort((a, b) => a.midY - b.midY),
    [slices]
  );

  const ringItems = useMemo(
    () =>
      items.map((it) => ({
        ...it,
        onClick: it.onClick ?? (onItemClick ? () => onItemClick(it.label) : undefined),
      })),
    [items, onItemClick]
  );

  useEffect(() => {
    function measureLines() {
      const containerEl = containerRef.current;
      const donutEl = donutRef.current;
      if (!containerEl || !donutEl) return;

      const containerRect = containerEl.getBoundingClientRect();
      const donutRect = donutEl.getBoundingClientRect();
      const next = slices
        .map((slice) => {
          const labelEl = labelRefs.current[slice.label];
          if (!labelEl) return null;
          const labelRect = labelEl.getBoundingClientRect();
          const isLeft = labelRect.left < containerRect.left + containerRect.width / 2;
          const x1 = isLeft ? labelRect.right - containerRect.left : labelRect.left - containerRect.left;
          const y1 = labelRect.top - containerRect.top + labelRect.height / 2;
          const x2 = donutRect.left - containerRect.left + slice.midX;
          const y2 = donutRect.top - containerRect.top + slice.midY;
          return { label: slice.label, x1, y1, x2, y2, isLeft, color: slice.color };
        })
        .filter((line) => line !== null) as Array<{
        label: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        isLeft: boolean;
        color?: string;
      }>;
      setLines(next);
    }

    measureLines();
    window.addEventListener("resize", measureLines);
    return () => window.removeEventListener("resize", measureLines);
  }, [slices]);

  return (
    <div className="ringViz" ref={containerRef}>
      <div className="ringTitle">{centerLabel}</div>
      <div className="ringLayout">
        <div className="rail left">
          {leftItems.map((item) => (
            <button
              key={item.label}
              ref={(el) => {
                labelRefs.current[item.label] = el;
              }}
              className={`railItem ${onItemClick ? "clickable" : ""} ${hoveredLabel === item.label ? "active" : ""}`}
              onMouseEnter={() => setHoveredLabel(item.label)}
              onMouseLeave={() => setHoveredLabel(null)}
              onClick={onItemClick ? () => onItemClick(item.label) : undefined}
            >
              <span className="railTop">
                <span className="railSwatch" style={{ background: item.color ?? "#333" }} />
                <span className="railLabel">{item.label}</span>
              </span>
              <span className="railMeta">
                {formatUSD(item.value)} • {item.pct.toFixed(1)}%
              </span>
            </button>
          ))}
        </div>

        <div className="railCenter" ref={donutRef}>
        <Sunburst
          rings={[{ items: ringItems, thickness, gap: 8 }]}
          size={size}
          centerLabel={centerLabel}
          showPercents={true}
          hoverRingIndex={0}
          activeLabel={hoveredLabel}
          onSliceHover={(info) => setHoveredLabel(info.label)}
          onSliceLeave={() => setHoveredLabel(null)}
        />
        </div>

        <div className="rail right">
          {rightItems.map((item) => (
            <button
              key={item.label}
              ref={(el) => {
                labelRefs.current[item.label] = el;
              }}
              className={`railItem ${onItemClick ? "clickable" : ""} ${hoveredLabel === item.label ? "active" : ""}`}
              onMouseEnter={() => setHoveredLabel(item.label)}
              onMouseLeave={() => setHoveredLabel(null)}
              onClick={onItemClick ? () => onItemClick(item.label) : undefined}
            >
              <span className="railTop">
                <span className="railSwatch" style={{ background: item.color ?? "#333" }} />
                <span className="railLabel">{item.label}</span>
              </span>
              <span className="railMeta">
                {formatUSD(item.value)} • {item.pct.toFixed(1)}%
              </span>
            </button>
          ))}
        </div>
      </div>

      <svg className="connectorLayer" aria-hidden="true">
        {lines.map((line) => {
          const active = hoveredLabel === line.label;
          const lineColor = line.color ?? "#8a8478";
          const elbowX = line.isLeft ? line.x1 + 16 : line.x1 - 16;
          return (
            <polyline
              key={line.label}
              points={`${line.x1},${line.y1} ${elbowX},${line.y1} ${line.x2},${line.y2}`}
              fill="none"
              stroke={active ? lineColor : "rgba(122,122,122,0.35)"}
              strokeWidth={active ? 1.4 : 0.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function Page() {
  const [income, setIncome] = useState<number>(0);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryLabel, setSelectedSubcategoryLabel] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState<boolean>(false);

  const { nycTaxableIncome, nycTax } = useMemo(() => {
    return computeNYCIncomeTax({
      income,
      filingStatus: DEFAULTS.filingStatus,
      nyStandardDeduction: DEFAULTS.nyStandardDeduction,
    });
  }, [income]);

  const categoryAlloc = useMemo(() => {
    const { items } = normalizeWeights(CATEGORIES);
    return items.map((c) => ({
      ...c,
      dollars: nycTax * c.norm,
    }));
  }, [nycTax]);

  const selectedCategory = useMemo(
    () => categoryAlloc.find((c) => c.id === selectedCategoryId) ?? null,
    [categoryAlloc, selectedCategoryId]
  );

  const selectedSubcats = useMemo(() => {
    if (!selectedCategory?.children?.length) return null;
    const { items } = normalizeWeights(selectedCategory.children);
    return items.map((sc) => ({
      ...sc,
      dollars: (selectedCategory.dollars ?? 0) * sc.norm,
    }));
  }, [selectedCategory]);

  const selectedSubcategory = useMemo(() => {
    if (!selectedSubcategoryLabel || !selectedSubcats?.length) return null;
    return selectedSubcats.find((sc) => sc.label === selectedSubcategoryLabel) ?? null;
  }, [selectedSubcats, selectedSubcategoryLabel]);

  useEffect(() => {
    setSelectedSubcategoryLabel(null);
  }, [selectedCategoryId]);

  const unlockTo = (lvl: number) => setUnlockedLevel((cur) => Math.max(cur, lvl));

  const donutColors = [
    "#1f1f1f",
    "#4aa7d8",
    "#e36a2e",
    "#6c7a89",
    "#9c7a3f",
    "#4a6b60",
    "#b8695b",
    "#7a6f9f",
    "#9bb3a6",
    "#b5a27f",
    "#546b9a",
    "#a96f86",
    "#6f8aa1",
    "#9f8f7a",
  ];

  const categoryDonutItems = categoryAlloc.map((c, i) => ({
    label: c.label,
    value: c.dollars,
    color: donutColors[i % donutColors.length],
  }));

  const subcatDonutItems = (selectedSubcats ?? []).map((sc, i) => ({
    label: sc.label,
    value: sc.dollars,
    color: donutColors[i % donutColors.length],
  }));
  const hasIncome = income > 0;

  return (
    <div className="wrap">
      <header className="header">
        <div className="brand">Where does my money go?</div>
        <div className="sub">New York City edition</div>
        <div className="breadcrumb">
          <button
            className="crumb"
            onClick={() => {
              setUnlockedLevel(0);
              setSelectedCategoryId(null);
              setSelectedSubcategoryLabel(null);
            }}
          >
            Income
          </button>
          <span className="crumbSep">/</span>
          <button
            className={`crumb ${unlockedLevel < 1 ? "disabled" : ""}`}
            onClick={() => {
              if (unlockedLevel >= 1) {
                setUnlockedLevel(1);
                setSelectedCategoryId(null);
                setSelectedSubcategoryLabel(null);
              }
            }}
          >
            Tax
          </button>
          <span className="crumbSep">/</span>
          <button
            className={`crumb ${unlockedLevel < 2 ? "disabled" : ""}`}
            onClick={() => {
              if (unlockedLevel >= 2) {
                setUnlockedLevel(2);
                setSelectedCategoryId(null);
                setSelectedSubcategoryLabel(null);
              }
            }}
          >
            Allocation
          </button>
          <span className="crumbSep">/</span>
          <button
            className={`crumb ${unlockedLevel < 3 ? "disabled" : ""}`}
            onClick={() => {
              if (unlockedLevel >= 3) {
                setUnlockedLevel(3);
              }
            }}
          >
            Drill-down
          </button>
        </div>
      </header>

      <main className="grid">
        <section className="topCards">
          <div className="card" onClick={() => unlockTo(2)} role="button" tabIndex={0}>
            <div className="kicker">INCOME</div>
            <div className="big">
              <span className="currencySign">$</span>
              <input
                className="incomeInput"
                value={income.toLocaleString("en-US")}
                onChange={(e) => setIncome(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
              />
              <span className="unit">/ Year</span>
            </div>
            <div className="note">Enter income to unlock tax and details.</div>
          </div>

          {unlockedLevel >= 1 && (
            <div className="card">
              <div className="kicker">NYC INCOME TAX</div>
              <div className="big">{formatUSD2(nycTax)}</div>
              <div className="note">Estimated annual NYC resident income tax.</div>
            </div>
          )}
        </section>

        <section className="stage">
          {unlockedLevel === 0 ? (
            <div className="stageCard stageCardIdle">
              <div className="kicker">DETAILS</div>
              <div className="stageSmall">Your annual NYC tax spending breakdown will appear here after you unlock Income.</div>
            </div>
          ) : (
            <div className="stageCard">
              <div className="kicker">DETAILS</div>
              {!hasIncome ? (
                <div className="stageSmall">Enter your income above to see your NYC tax allocation.</div>
              ) : null}

              {hasIncome && unlockedLevel >= 1 && unlockedLevel < 3 && (
                <>
                  <div className="stageSmall">Your NYC income tax allocated across categories</div>
                  <div className="fineprint">Hover a slice or label to highlight it. Click to drill down.</div>
                  <RingWithLabelRails
                    items={categoryDonutItems}
                    centerLabel="NYC Budget"
                    onItemClick={(label) => {
                      const match = categoryAlloc.find((x) => x.label === label);
                      if (match) {
                        setSelectedCategoryId(match.id);
                        setSelectedSubcategoryLabel(null);
                        unlockTo(3);
                      }
                    }}
                  />
                </>
              )}

              {hasIncome && unlockedLevel >= 3 && selectedCategory && (
                <>
                  {selectedSubcategory ? (
                    <div className="stageSpend">
                      You spend <b>{formatUSD(selectedCategory.dollars ?? 0)}</b> on <b>{selectedCategory.label}</b>. Within that,{" "}
                      <b>{formatUSD(selectedSubcategory.dollars ?? 0)}</b> on <b>{selectedSubcategory.label}</b>.
                    </div>
                  ) : (
                    <div className="stageSpend">
                      You spend <b>{formatUSD(selectedCategory.dollars ?? 0)}</b> on <b>{selectedCategory.label}</b>.
                    </div>
                  )}
                  <div className="note">Click on category to drill into the details.</div>
                  <RingWithLabelRails
                    items={subcatDonutItems}
                    centerLabel={selectedCategory.label}
                    onItemClick={(label) => setSelectedSubcategoryLabel(label)}
                  />
                </>
              )}
            </div>
          )}
        </section>
      </main>
      <footer className="footer">
        <div className="card footerCard">
          <div className="kicker">SOURCES</div>
          <ul className="sourceList">
            <li>
              <a href={SOURCES.nycTaxInstructions.href} target="_blank" rel="noreferrer">
                {SOURCES.nycTaxInstructions.label}
              </a>
            </li>
            <li>
              <a href={SOURCES.nycTaxTables.href} target="_blank" rel="noreferrer">
                {SOURCES.nycTaxTables.label}
              </a>
            </li>
            <li>
              <a href={SOURCES.nycWithholding2026.href} target="_blank" rel="noreferrer">
                {SOURCES.nycWithholding2026.label}
              </a>
            </li>
            <li>
              <a href={SOURCES.iboBudget100.href} target="_blank" rel="noreferrer">
                {SOURCES.iboBudget100.label}
              </a>
            </li>
            <li>
              <a href={SOURCES.nycFinancialPlanExpense.href} target="_blank" rel="noreferrer">
                {SOURCES.nycFinancialPlanExpense.label}
              </a>
            </li>
            <li>
              <a href={SOURCES.nycSchoolsFunding.href} target="_blank" rel="noreferrer">
                {SOURCES.nycSchoolsFunding.label}
              </a>
            </li>
          </ul>
          <div className="fineprint">
            2026 note: NYC rate schedule is unchanged; using the 2025 IT-201 NYC rate schedule (latest published).
          </div>
          <div className="fineprint">
            Note: This allocates your NYC income tax proportionally across NYC spending categories (a simplification because revenues are pooled).
          </div>
          <div className="fineprint">
            V1 uses simplified assumptions (single filer, standard deduction, no credits). Add toggles later for filing status, deductions, and credits.
          </div>
          <button className="methodBtn" onClick={() => setShowMethodology(true)}>
            Methodology
          </button>
        </div>
      </footer>

      {showMethodology && (
        <div className="modalOverlay" onClick={() => setShowMethodology(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalTitle">Methodology</div>
            <div className="modalBody">
              <div className="modalSection">
                NYC income tax uses the NYC rate schedule from the 2025 IT-201 instructions (latest published as of Feb 15, 2026).
                NYC rates are unchanged for 2026 per NY Tax Dept withholding guidance.
              </div>
              <div className="modalSection">
                Budget categories and agency splits for Public Safety and Health use the IBO “NYC’s Budget in $100”
                (FY2026 Adopted Expense Budget).
              </div>
              <div className="modalSection">
                Additional drill-down splits for Miscellaneous, Pensions, Debt Service, and Libraries use NYC OMB's
                FY2026 Adopted Budget Financial Plan Expense detail.
              </div>
              <div className="modalSection">
                Education subcategories use NYC Public Schools “Funding Our Schools” FY2026 breakdown.
              </div>
              <div className="modalSection">
                Note: This allocates your NYC income tax proportionally across NYC spending categories (a simplification because revenues are pooled).
              </div>
              <div className="sources">
                <a href={SOURCES.nycTaxInstructions.href} target="_blank" rel="noreferrer">
                  {SOURCES.nycTaxInstructions.label}
                </a>
                <a href={SOURCES.nycWithholding2026.href} target="_blank" rel="noreferrer">
                  {SOURCES.nycWithholding2026.label}
                </a>
                <a href={SOURCES.iboBudget100.href} target="_blank" rel="noreferrer">
                  {SOURCES.iboBudget100.label}
                </a>
                <a href={SOURCES.nycFinancialPlanExpense.href} target="_blank" rel="noreferrer">
                  {SOURCES.nycFinancialPlanExpense.label}
                </a>
                <a href={SOURCES.nycSchoolsFunding.href} target="_blank" rel="noreferrer">
                  {SOURCES.nycSchoolsFunding.label}
                </a>
              </div>
            </div>
            <button className="methodBtn" onClick={() => setShowMethodology(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        :root {
          --bg: #f6f4ee;
          --ink: #111111;
          --muted: #7a7a7a;
          --line: #dedad2;
          --card: #fbfaf6;
          --warm: #e36a2e;
          --cool: #4aa7d8;
        }
        .wrap {
          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji",
            "Segoe UI Emoji";
        }
        .header {
          padding: 28px 28px 16px 28px;
          border-bottom: 1px solid var(--line);
          text-align: center;
        }
        .brand {
          font-size: 42px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .sub {
          margin-top: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--muted);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .breadcrumb {
          margin-top: 10px;
          display: inline-flex;
          gap: 8px;
          align-items: center;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .crumb {
          background: transparent;
          border: 1px solid var(--line);
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #333;
          cursor: pointer;
        }
        .crumb:hover {
          background: rgba(0, 0, 0, 0.03);
        }
        .crumb.disabled {
          opacity: 0.5;
          pointer-events: none;
        }
        .crumbSep {
          color: var(--muted);
        }
        .grid {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 18px 18px 8px 18px;
        }
        .topCards {
          display: grid;
          grid-template-columns: repeat(2, minmax(280px, 1fr));
          gap: 14px;
        }
        .stage {
          display: flex;
          flex-direction: column;
        }
        .card,
        .stageCard {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
        }
        .card[role="button"] {
          cursor: pointer;
        }
        .kicker {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 10px;
        }
        .big {
          font-size: 36px;
          line-height: 1;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .incomeInput {
          font-size: 36px;
          font-weight: 400;
          font-family: inherit;
          line-height: 1;
          width: 210px;
          border: none;
          outline: none;
          background: transparent;
          color: var(--ink);
          padding: 0;
          margin: 0;
        }
        .currencySign {
          font-size: 36px;
          font-weight: 400;
          font-family: inherit;
          line-height: 1;
        }
        .unit {
          font-size: 14px;
          color: var(--muted);
          letter-spacing: 0.08em;
          text-transform: none;
        }
        .small {
          margin-top: 10px;
          font-size: 13px;
          color: #333;
        }
        .note {
          margin-top: 10px;
          font-size: 12px;
          color: var(--muted);
        }
        .sources {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
        }
        a {
          color: #2a2a2a;
          text-decoration: none;
          border-bottom: 1px dotted rgba(0, 0, 0, 0.25);
        }
        a:hover {
          border-bottom-style: solid;
        }
        .tileGrid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .tile {
          background: transparent;
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 10px;
          text-align: left;
          cursor: pointer;
          transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
        }
        .tile:hover {
          transform: translateY(-1px);
          border-color: #cfc9bf;
          background: rgba(0, 0, 0, 0.02);
        }
        .tile.active {
          outline: 2px solid rgba(0, 0, 0, 0.08);
        }
        .tile.cool {
          border-left: 4px solid var(--cool);
        }
        .tile.warm {
          border-left: 4px solid var(--warm);
        }
        .tileLabel {
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .tileValue {
          margin-top: 6px;
          font-size: 18px;
          font-weight: 650;
        }
        .tileMeta {
          margin-top: 2px;
          font-size: 12px;
          color: var(--muted);
        }
        .fineprint {
          margin-top: 10px;
          font-size: 11px;
          color: var(--muted);
          line-height: 1.35;
        }
        .stageBig {
          font-size: 32px;
          font-weight: 650;
          margin-top: 6px;
        }
        .stageSmall {
          margin-top: 8px;
          font-size: 13px;
          color: #333;
        }
        .stageCardIdle {
          min-height: 220px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
        }
        .stageCardIdle .stageSmall {
          margin-top: 0;
        }
        .stageSpend {
          margin-top: 8px;
          font-size: 18px;
          line-height: 1.35;
          color: #222;
        }
        .muted {
          color: var(--muted);
        }
        .sourceList {
          margin: 0;
          padding-left: 18px;
          color: #222;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .donutRow {
          margin-top: 12px;
          display: flex;
          justify-content: center;
        }
        .ringViz {
          margin-top: 12px;
          position: relative;
        }
        .ringTitle {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 10px;
        }
        .ringLayout {
          display: grid;
          grid-template-columns: minmax(200px, 1fr) auto minmax(200px, 1fr);
          gap: 14px;
          align-items: center;
          min-height: 390px;
        }
        .rail {
          display: flex;
          flex-direction: column;
          gap: 5px;
          max-height: 390px;
          overflow: auto;
          padding-right: 2px;
        }
        .rail.left {
          align-items: flex-end;
        }
        .rail.right {
          align-items: flex-start;
        }
        .railCenter {
          position: relative;
          z-index: 2;
        }
        .railItem {
          appearance: none;
          -webkit-appearance: none;
          width: 100%;
          max-width: 320px;
          border: none;
          background: transparent;
          border-radius: 0;
          padding: 2px 0;
          text-align: left;
          cursor: default;
          transition: color 120ms ease, opacity 120ms ease;
        }
        .railItem.clickable {
          cursor: pointer;
        }
        .railItem.clickable:hover {
          opacity: 0.9;
        }
        .railItem.active {
          color: #111;
        }
        .railTop {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .railSwatch {
          width: 10px;
          height: 10px;
          border-radius: 1px;
          flex-shrink: 0;
        }
        .railLabel {
          font-size: 12px;
          letter-spacing: 0.02em;
          text-transform: none;
          color: #555;
          line-height: 1.2;
        }
        .railMeta {
          margin-top: 1px;
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #666;
        }
        .connectorLayer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }
        .sunburst {
          overflow: visible;
        }
        .slice.clickable {
          cursor: pointer;
          transition: transform 120ms ease;
        }
        .slice.clickable:hover {
          transform: scale(1.003);
        }
        .slice.dimmed {
          opacity: 0.35;
        }
        .slice.active {
          opacity: 1;
        }
        .slicePct {
          font-size: 11px;
          font-weight: 650;
          fill: rgba(255, 255, 255, 0.95);
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
          pointer-events: none;
        }
        .sunCenter {
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          fill: #222;
        }
        .methodBtn {
          margin-top: 10px;
          border: 1px solid var(--line);
          background: transparent;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #333;
          cursor: pointer;
        }
        .methodBtn:hover {
          background: rgba(0, 0, 0, 0.03);
        }
        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 10, 10, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          z-index: 50;
        }
        .modalCard {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 18px;
          width: min(720px, 92vw);
          box-shadow: 0 6px 30px rgba(0, 0, 0, 0.15);
        }
        .modalTitle {
          font-size: 16px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .modalBody {
          margin-top: 10px;
          font-size: 13px;
          color: #333;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .modalSection {
          line-height: 1.5;
        }
        .footer {
          padding: 0 18px 24px 18px;
        }
        .footerCard {
          max-width: 980px;
          margin: 0 auto;
        }
        @media (max-width: 1100px) {
          .topCards {
            grid-template-columns: 1fr;
          }
          .ringLayout {
            grid-template-columns: 1fr;
            min-height: 0;
          }
          .rail {
            max-height: none;
            overflow: visible;
          }
          .rail.left,
          .rail.right {
            align-items: stretch;
          }
          .connectorLayer {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      {items
        .slice()
        .sort((a, b) => b.value - a.value)
        .map((it) => {
          const pct = (it.value / max) * 100;
          return (
            <div key={it.label} style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#666" }}>
                  {it.label}
                </div>
                <div style={{ height: 10, border: "1px solid #dedad2", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "rgba(0,0,0,0.10)" }} />
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: 650 }}>{formatUSD(it.value)}</div>
            </div>
          );
        })}
    </div>
  );
}
