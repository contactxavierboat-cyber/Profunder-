import { useState, useEffect, useRef, useCallback } from "react";

interface CommunityDataPoint {
  id: number;
  source: string;
  sourceUrl: string | null;
  sourceReference: string | null;
  lender: string;
  product: string | null;
  outcome: string;
  limitAmount: number | null;
  apr: string | null;
  score: number | null;
  scoreBand: string | null;
  income: number | null;
  incomeBand: string | null;
  utilization: number | null;
  inquiryCount: number | null;
  newAccounts6m: number | null;
  oldestAccountAgeMonths: number | null;
  avgAccountAgeMonths: number | null;
  bureauPulled: string | null;
  state: string | null;
  applicationType: string | null;
  businessRevenue: number | null;
  relationshipWithLender: string | null;
  derogatoriesPresent: boolean | null;
  rawText: string | null;
  aiSummary: string | null;
  notes: string | null;
  confidenceScore: number | null;
  moderationStatus: string;
  smartTags: string[] | null;
  submittedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Trends {
  totalPoints: number;
  approvals: number;
  denials: number;
  avgLimit: number;
  topBureau: string;
  topLender: string;
  topLendersByApproval: { lender: string; count: number }[];
  avgLimitByLender: { lender: string; avgLimit: number }[];
  outcomeByScoreBand: { band: string; approvals: number; denials: number }[];
  bureauByLender: { lender: string; bureau: string; count: number }[];
  recentTrendingLenders: { lender: string; count: number }[];
  forgivingLendersByInquiries: { lender: string; avgInquiries: number; approvalCount: number }[];
  commonDenialReasons: { tag: string; count: number }[];
}

interface SimilarResult {
  total: number;
  approvals: number;
  denials: number;
  reconsiderations: number;
  topLender: string;
  limitRange: string;
  dataPoints: CommunityDataPoint[];
}

interface Filters {
  source: string;
  outcome: string;
  lender: string;
  scoreMin: string;
  scoreMax: string;
  inquiryMin: string;
  inquiryMax: string;
  utilizationMin: string;
  utilizationMax: string;
  bureauPulled: string;
  applicationType: string;
  dateRange: string;
  search: string;
}

const defaultFilters: Filters = {
  source: "", outcome: "", lender: "", scoreMin: "", scoreMax: "",
  inquiryMin: "", inquiryMax: "", utilizationMin: "", utilizationMax: "",
  bureauPulled: "", applicationType: "", dateRange: "", search: "",
};

export default function CommunityUnlocks({ userProfile }: { userProfile?: any }) {
  const [dataPoints, setDataPoints] = useState<CommunityDataPoint[]>([]);
  const [total, setTotal] = useState(0);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [viewMode, setViewMode] = useState<"table" | "card">("card");
  const [activeSection, setActiveSection] = useState<"browse" | "trends" | "similar" | "submit" | "extract" | "admin">("browse");
  const [selectedDP, setSelectedDP] = useState<CommunityDataPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [similarResult, setSimilarResult] = useState<SimilarResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [submitForm, setSubmitForm] = useState<any>({
    source: "manual", lender: "", product: "", outcome: "approval", limitAmount: "",
    score: "", income: "", utilization: "", inquiryCount: "", newAccounts6m: "",
    oldestAccountAgeMonths: "", bureauPulled: "", state: "", applicationType: "personal",
    notes: "", rawText: "", sourceUrl: "",
  });
  const [extractText, setExtractText] = useState("");
  const [extractResult, setExtractResult] = useState<any>(null);
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.source) params.set("source", filters.source);
      if (filters.outcome) params.set("outcome", filters.outcome);
      if (filters.lender) params.set("lender", filters.lender);
      if (filters.scoreMin) params.set("scoreMin", filters.scoreMin);
      if (filters.scoreMax) params.set("scoreMax", filters.scoreMax);
      if (filters.inquiryMin) params.set("inquiryMin", filters.inquiryMin);
      if (filters.inquiryMax) params.set("inquiryMax", filters.inquiryMax);
      if (filters.utilizationMin) params.set("utilizationMin", filters.utilizationMin);
      if (filters.utilizationMax) params.set("utilizationMax", filters.utilizationMax);
      if (filters.bureauPulled) params.set("bureauPulled", filters.bureauPulled);
      if (filters.applicationType) params.set("applicationType", filters.applicationType);
      if (filters.dateRange) params.set("dateRange", filters.dateRange);
      if (filters.search) params.set("search", filters.search);
      params.set("limit", "50");
      params.set("offset", String(page * 50));
      const resp = await fetch(`/api/community/data-points?${params}`);
      if (!resp.ok) throw new Error("Failed to load data");
      const result = await resp.json();
      setDataPoints(result.data || []);
      setTotal(result.total || 0);
    } catch (e: any) { console.error("Community data fetch error:", e); } finally { setLoading(false); }
  }, [filters, page]);

  const fetchTrends = useCallback(async () => {
    try {
      const resp = await fetch("/api/community/trends");
      if (!resp.ok) throw new Error("Failed to load trends");
      const data = await resp.json();
      setTrends(data);
    } catch (e: any) { console.error("Trends fetch error:", e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const body: any = { ...submitForm };
      if (body.limitAmount) body.limitAmount = parseInt(body.limitAmount);
      if (body.score) body.score = parseInt(body.score);
      if (body.income) body.income = parseInt(body.income);
      if (body.utilization) body.utilization = parseInt(body.utilization);
      if (body.inquiryCount) body.inquiryCount = parseInt(body.inquiryCount);
      if (body.newAccounts6m) body.newAccounts6m = parseInt(body.newAccounts6m);
      if (body.oldestAccountAgeMonths) body.oldestAccountAgeMonths = parseInt(body.oldestAccountAgeMonths);
      Object.keys(body).forEach(k => { if (body[k] === "") body[k] = undefined; });
      const resp = await fetch("/api/community/data-points", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.error || "Submit failed"); }
      setSubmitForm({ source: "manual", lender: "", product: "", outcome: "approval", limitAmount: "", score: "", income: "", utilization: "", inquiryCount: "", newAccounts6m: "", oldestAccountAgeMonths: "", bureauPulled: "", state: "", applicationType: "personal", notes: "", rawText: "", sourceUrl: "" });
      fetchData();
    } catch (e: any) { alert(e.message || "Failed to submit data point"); } finally { setSubmitting(false); }
  };

  const handleExtract = async () => {
    setExtracting(true);
    try {
      const resp = await fetch("/api/community/extract", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: extractText }),
      });
      if (!resp.ok) throw new Error("Extraction failed");
      const data = await resp.json();
      setExtractResult(data);
    } catch (e: any) { alert(e.message || "Failed to extract data"); } finally { setExtracting(false); }
  };

  const handleSaveExtracted = async () => {
    if (!extractResult) return;
    setSubmitting(true);
    try {
      const body = { ...extractResult };
      delete body.rawText;
      body.rawText = extractText;
      body.source = "reddit";
      Object.keys(body).forEach(k => { if (body[k] === null || body[k] === undefined) delete body[k]; });
      const resp = await fetch("/api/community/data-points", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.error || "Save failed"); }
      setExtractText("");
      setExtractResult(null);
      fetchData();
    } catch (e: any) { alert(e.message || "Failed to save extracted data"); } finally { setSubmitting(false); }
  };

  const handleSimilarProfiles = async () => {
    try {
      const profile: any = {};
      if (userProfile?.creditScoreExact) profile.score = userProfile.creditScoreExact;
      if (userProfile?.utilizationPercent) profile.utilization = userProfile.utilizationPercent;
      if (userProfile?.inquiries) profile.inquiries = userProfile.inquiries;
      if (userProfile?.oldestAccountYears) profile.oldestAccountMonths = userProfile.oldestAccountYears * 12;
      const resp = await fetch("/api/community/similar-profiles", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile),
      });
      if (!resp.ok) throw new Error("Failed to find similar profiles");
      const data = await resp.json();
      setSimilarResult(data);
    } catch (e: any) { console.error("Similar profiles error:", e); }
  };

  useEffect(() => { if (activeSection === "similar") handleSimilarProfiles(); }, [activeSection]);

  const outcomeColor = (outcome: string) => {
    switch (outcome) {
      case "approval": return "#2d6a4f";
      case "denial": return "#c0392b";
      case "reconsideration": return "#c9a227";
      case "cli": return "#2563eb";
      default: return "#888";
    }
  };

  const outcomeBg = (outcome: string) => {
    switch (outcome) {
      case "approval": return "#ecfdf5";
      case "denial": return "#fef2f2";
      case "reconsideration": return "#fffbeb";
      case "cli": return "#eff6ff";
      default: return "#f5f5f5";
    }
  };

  const fmt = (n: number | null | undefined) => n != null ? n.toLocaleString() : "—";
  const fmtDollar = (n: number | null | undefined) => n != null ? `$${n.toLocaleString()}` : "—";

  const SectionNav = () => (
    <div className="flex gap-1 mb-4 overflow-x-auto pb-1" data-testid="unlocks-section-nav">
      {([
        { key: "browse" as const, label: "Browse" },
        { key: "trends" as const, label: "Trends" },
        { key: "similar" as const, label: "My Match" },
        { key: "submit" as const, label: "Submit" },
        { key: "extract" as const, label: "AI Extract" },
      ] as const).map(s => (
        <button
          key={s.key}
          onClick={() => setActiveSection(s.key)}
          className={`px-3 py-1.5 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors ${activeSection === s.key ? "bg-[#111] text-white" : "text-[#555] hover:bg-[#f0f0f0]"}`}
          data-testid={`tab-section-${s.key}`}
        >{s.label}</button>
      ))}
    </div>
  );

  const StatCards = () => {
    if (!trends) return null;
    const stats = [
      { label: "Total Data Points", value: trends.totalPoints.toLocaleString() },
      { label: "Approvals", value: trends.approvals.toLocaleString(), color: "#2d6a4f" },
      { label: "Denials", value: trends.denials.toLocaleString(), color: "#c0392b" },
      { label: "Avg Limit", value: fmtDollar(trends.avgLimit) },
      { label: "Top Bureau", value: trends.topBureau },
      { label: "Top Lender", value: trends.topLender },
    ];
    return (
      <div className="grid grid-cols-3 gap-2 mb-4" data-testid="unlocks-stat-cards">
        {stats.map((s, i) => (
          <div key={i} className="bg-[#fafafa] border border-[#eee] rounded-lg px-3 py-2.5">
            <p className="text-[8px] text-[#999] font-medium tracking-wider uppercase">{s.label}</p>
            <p className="text-[16px] font-semibold mt-0.5" style={{ color: s.color || "#111" }}>{s.value}</p>
          </div>
        ))}
      </div>
    );
  };

  const FilterPanel = () => (
    <div className={`${showFilters ? "block" : "hidden"} mb-4 p-3 bg-[#fafafa] border border-[#eee] rounded-lg`} data-testid="unlocks-filter-panel">
      <div className="grid grid-cols-2 gap-2 mb-2">
        <select value={filters.source} onChange={e => setFilters(p => ({ ...p, source: e.target.value }))} className="text-[11px] px-2 py-1.5 bg-white border border-[#ddd] rounded-md" data-testid="filter-source">
          <option value="">All Sources</option>
          <option value="reddit">Reddit</option>
          <option value="myfico">myFICO</option>
          <option value="manual">Manual</option>
        </select>
        <select value={filters.outcome} onChange={e => setFilters(p => ({ ...p, outcome: e.target.value }))} className="text-[11px] px-2 py-1.5 bg-white border border-[#ddd] rounded-md" data-testid="filter-outcome">
          <option value="">All Outcomes</option>
          <option value="approval">Approval</option>
          <option value="denial">Denial</option>
          <option value="reconsideration">Reconsideration</option>
          <option value="cli">CLI</option>
        </select>
        <select value={filters.bureauPulled} onChange={e => setFilters(p => ({ ...p, bureauPulled: e.target.value }))} className="text-[11px] px-2 py-1.5 bg-white border border-[#ddd] rounded-md" data-testid="filter-bureau">
          <option value="">All Bureaus</option>
          <option value="Experian">Experian</option>
          <option value="TransUnion">TransUnion</option>
          <option value="Equifax">Equifax</option>
        </select>
        <select value={filters.applicationType} onChange={e => setFilters(p => ({ ...p, applicationType: e.target.value }))} className="text-[11px] px-2 py-1.5 bg-white border border-[#ddd] rounded-md" data-testid="filter-app-type">
          <option value="">Personal & Business</option>
          <option value="personal">Personal</option>
          <option value="business">Business</option>
        </select>
        <select value={filters.dateRange} onChange={e => setFilters(p => ({ ...p, dateRange: e.target.value }))} className="text-[11px] px-2 py-1.5 bg-white border border-[#ddd] rounded-md" data-testid="filter-date-range">
          <option value="">All Time</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
        </select>
        <input
          value={filters.lender}
          onChange={e => setFilters(p => ({ ...p, lender: e.target.value }))}
          placeholder="Lender name..."
          className="text-[11px] px-2 py-1.5 bg-white border border-[#ddd] rounded-md"
          data-testid="filter-lender-input"
        />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <input value={filters.scoreMin} onChange={e => setFilters(p => ({ ...p, scoreMin: e.target.value }))} placeholder="Score min" className="text-[11px] px-2 py-1.5 bg-white border border-[#ddd] rounded-md" data-testid="filter-score-min" />
        <input value={filters.scoreMax} onChange={e => setFilters(p => ({ ...p, scoreMax: e.target.value }))} placeholder="Score max" className="text-[11px] px-2 py-1.5 bg-white border border-[#ddd] rounded-md" data-testid="filter-score-max" />
        <input value={filters.inquiryMax} onChange={e => setFilters(p => ({ ...p, inquiryMax: e.target.value }))} placeholder="Max inquiries" className="text-[11px] px-2 py-1.5 bg-white border border-[#ddd] rounded-md" data-testid="filter-inq-max" />
        <input value={filters.utilizationMin} onChange={e => setFilters(p => ({ ...p, utilizationMin: e.target.value }))} placeholder="Util min %" className="text-[11px] px-2 py-1.5 bg-white border border-[#ddd] rounded-md" data-testid="filter-util-min" />
        <input value={filters.utilizationMax} onChange={e => setFilters(p => ({ ...p, utilizationMax: e.target.value }))} placeholder="Util max %" className="text-[11px] px-2 py-1.5 bg-white border border-[#ddd] rounded-md" data-testid="filter-util-max" />
        <input value={filters.inquiryMin} onChange={e => setFilters(p => ({ ...p, inquiryMin: e.target.value }))} placeholder="Min inquiries" className="text-[11px] px-2 py-1.5 bg-white border border-[#ddd] rounded-md" data-testid="filter-inq-min" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setPage(0); fetchData(); }} className="px-3 py-1.5 text-[10px] font-medium bg-[#111] text-white rounded-md" data-testid="button-apply-filters">Apply</button>
        <button onClick={() => { setFilters(defaultFilters); setPage(0); }} className="px-3 py-1.5 text-[10px] font-medium text-[#555] bg-white border border-[#ddd] rounded-md" data-testid="button-clear-filters">Clear</button>
      </div>
    </div>
  );

  const DataCard = ({ dp }: { dp: CommunityDataPoint }) => (
    <div
      className="border border-[#eee] rounded-lg p-3 bg-white hover:border-[#ccc] transition-colors cursor-pointer"
      onClick={() => setSelectedDP(dp)}
      data-testid={`card-dp-${dp.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[13px] font-semibold text-[#111]">{dp.lender}</p>
          <p className="text-[11px] text-[#777]">{dp.product || "—"}</p>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
          style={{ color: outcomeColor(dp.outcome), backgroundColor: outcomeBg(dp.outcome) }}
        >{dp.outcome}</span>
      </div>
      <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-[10px]">
        <div><span className="text-[#999]">Limit</span><br /><span className="text-[#333] font-medium">{fmtDollar(dp.limitAmount)}</span></div>
        <div><span className="text-[#999]">Score</span><br /><span className="text-[#333] font-medium">{fmt(dp.score)}</span></div>
        <div><span className="text-[#999]">Income</span><br /><span className="text-[#333] font-medium">{fmtDollar(dp.income)}</span></div>
        <div><span className="text-[#999]">Util</span><br /><span className="text-[#333] font-medium">{dp.utilization != null ? `${dp.utilization}%` : "—"}</span></div>
        <div><span className="text-[#999]">Inquiries</span><br /><span className="text-[#333] font-medium">{fmt(dp.inquiryCount)}</span></div>
        <div><span className="text-[#999]">Bureau</span><br /><span className="text-[#333] font-medium">{dp.bureauPulled || "—"}</span></div>
      </div>
      {dp.smartTags && dp.smartTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {dp.smartTags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 text-[8px] font-medium text-[#666] bg-[#f0f0f0] rounded">{tag}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f0f0f0]">
        <span className="text-[9px] text-[#bbb]">{dp.source} · {new Date(dp.createdAt).toLocaleDateString()}{dp.confidenceScore ? ` · ${dp.confidenceScore}%` : ""}</span>
        <button
          onClick={e => { e.stopPropagation(); setSelectedDP(dp); }}
          className="text-[9px] font-medium text-[#555] hover:text-[#111] transition-colors"
          data-testid={`button-view-details-${dp.id}`}
        >View Details →</button>
      </div>
    </div>
  );

  const DataTable = () => (
    <div className="overflow-x-auto" data-testid="unlocks-data-table">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-[#eee]">
            {["Lender", "Product", "Outcome", "Limit", "Score", "Income", "Util", "Inq", "Bureau", "Source", "Date", "Conf", ""].map(h => (
              <th key={h} className="text-left py-2 px-2 text-[9px] font-semibold text-[#999] uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataPoints.map(dp => (
            <tr
              key={dp.id}
              className="border-b border-[#f5f5f5] hover:bg-[#fafafa] cursor-pointer transition-colors"
              onClick={() => setSelectedDP(dp)}
              data-testid={`row-dp-${dp.id}`}
            >
              <td className="py-2 px-2 font-medium text-[#111]">{dp.lender}</td>
              <td className="py-2 px-2 text-[#555]">{dp.product || "—"}</td>
              <td className="py-2 px-2"><span className="px-1.5 py-0.5 rounded text-[9px] font-semibold capitalize" style={{ color: outcomeColor(dp.outcome), backgroundColor: outcomeBg(dp.outcome) }}>{dp.outcome}</span></td>
              <td className="py-2 px-2 text-[#333]">{fmtDollar(dp.limitAmount)}</td>
              <td className="py-2 px-2 text-[#333]">{fmt(dp.score)}</td>
              <td className="py-2 px-2 text-[#333]">{fmtDollar(dp.income)}</td>
              <td className="py-2 px-2 text-[#333]">{dp.utilization != null ? `${dp.utilization}%` : "—"}</td>
              <td className="py-2 px-2 text-[#333]">{fmt(dp.inquiryCount)}</td>
              <td className="py-2 px-2 text-[#555]">{dp.bureauPulled || "—"}</td>
              <td className="py-2 px-2 text-[#999]">{dp.source}</td>
              <td className="py-2 px-2 text-[#999] whitespace-nowrap">{new Date(dp.createdAt).toLocaleDateString()}</td>
              <td className="py-2 px-2 text-[#999]">{dp.confidenceScore ? `${dp.confidenceScore}%` : "—"}</td>
              <td className="py-2 px-2"><button onClick={e => { e.stopPropagation(); setSelectedDP(dp); }} className="text-[9px] font-medium text-[#555] hover:text-[#111]" data-testid={`button-table-details-${dp.id}`}>Details →</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const DetailModal = () => {
    if (!selectedDP) return null;
    const dp = selectedDP;
    const insights: string[] = [];
    if (dp.outcome === "approval") {
      if (dp.score && dp.score >= 720) insights.push("Strong credit score likely contributed to approval");
      if (dp.utilization !== null && dp.utilization <= 20) insights.push("Low utilization signals responsible credit usage");
      if (dp.relationshipWithLender) insights.push(`Existing relationship with ${dp.lender} may have helped`);
      if (dp.inquiryCount !== null && dp.inquiryCount <= 3) insights.push("Low inquiry count reduces lender concern about credit-seeking");
    } else if (dp.outcome === "denial") {
      if (dp.inquiryCount !== null && dp.inquiryCount >= 5) insights.push("High inquiry count is a common denial trigger");
      if (dp.utilization !== null && dp.utilization >= 50) insights.push("Elevated utilization may signal overextension to lenders");
      if (dp.score !== null && dp.score < 670) insights.push("Score below 670 is below most lender thresholds");
      if (dp.newAccounts6m !== null && dp.newAccounts6m >= 3) insights.push("Multiple recent accounts can indicate velocity risk");
    }
    if (insights.length === 0) insights.push("Insufficient data to generate specific insights");

    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDP(null)} data-testid="detail-modal-overlay">
        <div className="bg-white rounded-xl max-w-[640px] w-full max-h-[85vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()} data-testid="detail-modal">
          <div className="sticky top-0 bg-white border-b border-[#eee] px-5 py-3 flex items-center justify-between z-10">
            <div>
              <p className="text-[15px] font-semibold text-[#111]">{dp.lender}</p>
              <p className="text-[11px] text-[#777]">{dp.product || "General"} · <span className="capitalize" style={{ color: outcomeColor(dp.outcome) }}>{dp.outcome}</span></p>
            </div>
            <button onClick={() => setSelectedDP(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0f0f0]" data-testid="button-close-detail">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#555" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
          </div>

          <div className="px-5 py-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Credit Limit", value: fmtDollar(dp.limitAmount) },
                { label: "APR", value: dp.apr || "—" },
                { label: "Credit Score", value: fmt(dp.score) },
                { label: "Income", value: fmtDollar(dp.income) },
                { label: "Utilization", value: dp.utilization != null ? `${dp.utilization}%` : "—" },
                { label: "Hard Inquiries", value: fmt(dp.inquiryCount) },
                { label: "New Accts (6mo)", value: fmt(dp.newAccounts6m) },
                { label: "Oldest Acct", value: dp.oldestAccountAgeMonths ? `${Math.floor(dp.oldestAccountAgeMonths / 12)}y ${dp.oldestAccountAgeMonths % 12}m` : "—" },
                { label: "Avg Acct Age", value: dp.avgAccountAgeMonths ? `${Math.floor(dp.avgAccountAgeMonths / 12)}y ${dp.avgAccountAgeMonths % 12}m` : "—" },
                { label: "Bureau Pulled", value: dp.bureauPulled || "—" },
                { label: "State", value: dp.state || "—" },
                { label: "Type", value: dp.applicationType || "personal" },
              ].map((f, i) => (
                <div key={i} className="bg-[#fafafa] rounded-lg px-2.5 py-2">
                  <p className="text-[8px] text-[#999] font-medium uppercase tracking-wider">{f.label}</p>
                  <p className="text-[12px] font-medium text-[#222] mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>

            {dp.relationshipWithLender && (
              <div className="mb-3 p-2.5 bg-[#fafafa] rounded-lg">
                <p className="text-[9px] text-[#999] font-medium uppercase tracking-wider mb-1">Lender Relationship</p>
                <p className="text-[11px] text-[#333]">{dp.relationshipWithLender}</p>
              </div>
            )}

            {dp.smartTags && dp.smartTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {dp.smartTags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 text-[9px] font-medium text-[#555] bg-[#f0f0f0] rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {dp.aiSummary && (
              <div className="mb-4 p-3 bg-[#f8f9fa] border border-[#eee] rounded-lg">
                <p className="text-[9px] text-[#999] font-semibold uppercase tracking-wider mb-1.5">AI Summary</p>
                <p className="text-[11px] text-[#333] leading-[1.6]">{dp.aiSummary}</p>
              </div>
            )}

            <div className="mb-4 p-3 bg-[#f8f9fa] border border-[#eee] rounded-lg">
              <p className="text-[9px] text-[#999] font-semibold uppercase tracking-wider mb-2">Insights</p>
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <span className="text-[9px] mt-0.5">{dp.outcome === "approval" ? "✓" : "⚠"}</span>
                  <p className="text-[11px] text-[#444] leading-[1.5]">{insight}</p>
                </div>
              ))}
              <p className="text-[8px] text-[#bbb] mt-2 italic">Based on observed community patterns — not a guarantee of outcomes</p>
            </div>

            {(() => {
              const similar = dataPoints.filter(
                d => d.id !== dp.id && d.lender === dp.lender && d.outcome !== dp.outcome
              ).slice(0, 3);
              if (similar.length === 0) return null;
              return (
                <div className="mb-4 p-3 bg-[#f8f9fa] border border-[#eee] rounded-lg">
                  <p className="text-[9px] text-[#999] font-semibold uppercase tracking-wider mb-2">Similar Data Points</p>
                  {similar.map(s => (
                    <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-[#f0f0f0] last:border-0 cursor-pointer hover:bg-[#f0f0f0] px-1 rounded" onClick={() => setSelectedDP(s)} data-testid={`similar-dp-${s.id}`}>
                      <div>
                        <p className="text-[10px] text-[#333] font-medium">{s.product || s.lender} · <span className="capitalize" style={{ color: outcomeColor(s.outcome) }}>{s.outcome}</span></p>
                        <p className="text-[9px] text-[#999]">Score: {fmt(s.score)} · Util: {s.utilization != null ? `${s.utilization}%` : "—"} · Inq: {fmt(s.inquiryCount)}</p>
                      </div>
                      <span className="text-[9px] text-[#999]">{fmtDollar(s.limitAmount)}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {dp.rawText && (
              <div className="mb-3">
                <p className="text-[9px] text-[#999] font-semibold uppercase tracking-wider mb-1.5">Original Text</p>
                <div className="p-2.5 bg-[#fafafa] border border-[#eee] rounded-lg max-h-[120px] overflow-y-auto">
                  <p className="text-[10px] text-[#555] leading-[1.6] whitespace-pre-wrap">{dp.rawText}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[9px] text-[#bbb] pt-3 border-t border-[#eee]">
              <span>Source: {dp.source}{dp.sourceUrl ? ` · ${dp.sourceUrl}` : ""}</span>
              <span>Confidence: {dp.confidenceScore || "—"}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TrendsSection = () => {
    if (!trends) return <p className="text-[11px] text-[#999] text-center py-8">Loading trends...</p>;
    return (
      <div className="space-y-4" data-testid="unlocks-trends">
        <div className="p-3 bg-[#fafafa] border border-[#eee] rounded-lg">
          <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wider mb-2">Top Lenders by Approvals</p>
          {trends.topLendersByApproval.length === 0 && <p className="text-[11px] text-[#bbb]">No data yet</p>}
          {trends.topLendersByApproval.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#f0f0f0] last:border-0">
              <span className="text-[11px] text-[#333] font-medium">{l.lender}</span>
              <span className="text-[11px] text-[#2d6a4f] font-semibold">{l.count} approvals</span>
            </div>
          ))}
        </div>

        <div className="p-3 bg-[#fafafa] border border-[#eee] rounded-lg">
          <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wider mb-2">Average Limit by Lender</p>
          {trends.avgLimitByLender.length === 0 && <p className="text-[11px] text-[#bbb]">No data yet</p>}
          {trends.avgLimitByLender.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#f0f0f0] last:border-0">
              <span className="text-[11px] text-[#333] font-medium">{l.lender}</span>
              <span className="text-[11px] text-[#111] font-semibold">{fmtDollar(l.avgLimit)}</span>
            </div>
          ))}
        </div>

        <div className="p-3 bg-[#fafafa] border border-[#eee] rounded-lg">
          <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wider mb-2">Approval Rates by Score Band</p>
          {trends.outcomeByScoreBand.length === 0 && <p className="text-[11px] text-[#bbb]">No data yet</p>}
          {trends.outcomeByScoreBand.map((b, i) => {
            const total = b.approvals + b.denials;
            const rate = total > 0 ? Math.round((b.approvals / total) * 100) : 0;
            return (
              <div key={i} className="mb-2 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#333] font-medium">{b.band}</span>
                  <span className="text-[10px] text-[#555]">{rate}% approval ({b.approvals}A / {b.denials}D)</span>
                </div>
                <div className="h-1.5 bg-[#eee] rounded-full overflow-hidden">
                  <div className="h-full bg-[#2d6a4f] rounded-full" style={{ width: `${rate}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-[#fafafa] border border-[#eee] rounded-lg">
          <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wider mb-2">Bureau Pull Patterns</p>
          {trends.bureauByLender.length === 0 && <p className="text-[11px] text-[#bbb]">No data yet</p>}
          {trends.bureauByLender.slice(0, 10).map((b, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-[#f0f0f0] last:border-0">
              <span className="text-[11px] text-[#333]">{b.lender}</span>
              <span className="text-[10px] text-[#555]">{b.bureau} ({b.count})</span>
            </div>
          ))}
        </div>

        <div className="p-3 bg-[#fafafa] border border-[#eee] rounded-lg">
          <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wider mb-2">Trending Lenders (30 Days)</p>
          {trends.recentTrendingLenders.length === 0 && <p className="text-[11px] text-[#bbb]">No data yet</p>}
          {trends.recentTrendingLenders.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#f0f0f0] last:border-0">
              <span className="text-[11px] text-[#333] font-medium">{l.lender}</span>
              <span className="text-[10px] text-[#555]">{l.count} data points</span>
            </div>
          ))}
        </div>

        {trends.forgivingLendersByInquiries && trends.forgivingLendersByInquiries.length > 0 && (
          <div className="p-3 bg-[#fafafa] border border-[#eee] rounded-lg">
            <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wider mb-2">Most Forgiving Lenders (High Inquiry Tolerance)</p>
            {trends.forgivingLendersByInquiries.map((l, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#f0f0f0] last:border-0">
                <span className="text-[11px] text-[#333] font-medium">{l.lender}</span>
                <span className="text-[10px] text-[#555]">avg {l.avgInquiries} inq · {l.approvalCount} approvals</span>
              </div>
            ))}
          </div>
        )}

        {trends.commonDenialReasons && trends.commonDenialReasons.length > 0 && (
          <div className="p-3 bg-[#fafafa] border border-[#eee] rounded-lg">
            <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wider mb-2">Common Denial Reasons</p>
            {trends.commonDenialReasons.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#f0f0f0] last:border-0">
                <span className="text-[11px] text-[#333] capitalize">{r.tag.replace(/-/g, " ")}</span>
                <span className="text-[10px] text-[#c0392b] font-medium">{r.count} cases</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[8px] text-[#bbb] italic text-center">All trends reflect observed community patterns, not guaranteed outcomes.</p>
      </div>
    );
  };

  const SimilarSection = () => {
    if (!similarResult) return <p className="text-[11px] text-[#999] text-center py-8">Analyzing your profile...</p>;
    if (similarResult.total === 0) return (
      <div className="text-center py-8">
        <p className="text-[13px] text-[#555] mb-2">No similar profiles found</p>
        <p className="text-[11px] text-[#999]">Upload a credit report to populate your profile for matching</p>
      </div>
    );
    return (
      <div data-testid="unlocks-similar">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#ecfdf5] border border-[#d1fae5] rounded-lg px-3 py-2.5 text-center">
            <p className="text-[20px] font-semibold text-[#2d6a4f]">{similarResult.approvals}</p>
            <p className="text-[9px] text-[#2d6a4f] font-medium">Approvals</p>
          </div>
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg px-3 py-2.5 text-center">
            <p className="text-[20px] font-semibold text-[#c0392b]">{similarResult.denials}</p>
            <p className="text-[9px] text-[#c0392b] font-medium">Denials</p>
          </div>
        </div>
        <div className="p-3 bg-[#fafafa] border border-[#eee] rounded-lg mb-4">
          <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wider mb-2">Match Summary</p>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between"><span className="text-[#555]">Similar Profiles</span><span className="text-[#111] font-medium">{similarResult.total}</span></div>
            <div className="flex justify-between"><span className="text-[#555]">Common Lender</span><span className="text-[#111] font-medium">{similarResult.topLender}</span></div>
            <div className="flex justify-between"><span className="text-[#555]">Typical Limits</span><span className="text-[#111] font-medium">{similarResult.limitRange}</span></div>
            {similarResult.reconsiderations > 0 && <div className="flex justify-between"><span className="text-[#555]">Reconsiderations</span><span className="text-[#c9a227] font-medium">{similarResult.reconsiderations}</span></div>}
          </div>
        </div>
        {similarResult.dataPoints.length > 0 && (
          <div>
            <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wider mb-2">Sample Matches</p>
            <div className="space-y-2">
              {similarResult.dataPoints.slice(0, 5).map(dp => <DataCard key={dp.id} dp={dp} />)}
            </div>
          </div>
        )}
        <p className="text-[8px] text-[#bbb] italic text-center mt-3">Similar profiles based on score band, utilization, inquiry count, and account age.</p>
      </div>
    );
  };

  const inputCls = "w-full text-[11px] px-2.5 py-2 bg-white border border-[#ddd] rounded-lg focus:outline-none focus:border-[#999]";
  const labelCls = "text-[9px] text-[#999] font-medium uppercase tracking-wider mb-1 block";

  const SubmitSection = () => (
    <div data-testid="unlocks-submit-form">
      <p className="text-[11px] text-[#555] mb-3">Submit a new community data point manually.</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>Source</label>
          <select value={submitForm.source} onChange={e => setSubmitForm((p: any) => ({ ...p, source: e.target.value }))} className={inputCls} data-testid="submit-source">
            <option value="manual">Manual</option>
            <option value="reddit">Reddit</option>
            <option value="myfico">myFICO</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Outcome</label>
          <select value={submitForm.outcome} onChange={e => setSubmitForm((p: any) => ({ ...p, outcome: e.target.value }))} className={inputCls} data-testid="submit-outcome">
            <option value="approval">Approval</option>
            <option value="denial">Denial</option>
            <option value="reconsideration">Reconsideration</option>
            <option value="cli">CLI</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Lender *</label>
          <input value={submitForm.lender} onChange={e => setSubmitForm((p: any) => ({ ...p, lender: e.target.value }))} className={inputCls} placeholder="e.g. Chase" data-testid="submit-lender" />
        </div>
        <div>
          <label className={labelCls}>Product</label>
          <input value={submitForm.product} onChange={e => setSubmitForm((p: any) => ({ ...p, product: e.target.value }))} className={inputCls} placeholder="e.g. Sapphire Preferred" data-testid="submit-product" />
        </div>
        <div>
          <label className={labelCls}>Credit Limit</label>
          <input value={submitForm.limitAmount} onChange={e => setSubmitForm((p: any) => ({ ...p, limitAmount: e.target.value }))} className={inputCls} placeholder="e.g. 15000" data-testid="submit-limit" />
        </div>
        <div>
          <label className={labelCls}>Credit Score</label>
          <input value={submitForm.score} onChange={e => setSubmitForm((p: any) => ({ ...p, score: e.target.value }))} className={inputCls} placeholder="e.g. 720" data-testid="submit-score" />
        </div>
        <div>
          <label className={labelCls}>Income</label>
          <input value={submitForm.income} onChange={e => setSubmitForm((p: any) => ({ ...p, income: e.target.value }))} className={inputCls} placeholder="e.g. 65000" data-testid="submit-income" />
        </div>
        <div>
          <label className={labelCls}>Utilization %</label>
          <input value={submitForm.utilization} onChange={e => setSubmitForm((p: any) => ({ ...p, utilization: e.target.value }))} className={inputCls} placeholder="e.g. 15" data-testid="submit-utilization" />
        </div>
        <div>
          <label className={labelCls}>Inquiries</label>
          <input value={submitForm.inquiryCount} onChange={e => setSubmitForm((p: any) => ({ ...p, inquiryCount: e.target.value }))} className={inputCls} placeholder="e.g. 3" data-testid="submit-inquiries" />
        </div>
        <div>
          <label className={labelCls}>Bureau Pulled</label>
          <select value={submitForm.bureauPulled} onChange={e => setSubmitForm((p: any) => ({ ...p, bureauPulled: e.target.value }))} className={inputCls} data-testid="submit-bureau">
            <option value="">Unknown</option>
            <option value="Experian">Experian</option>
            <option value="TransUnion">TransUnion</option>
            <option value="Equifax">Equifax</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>State</label>
          <input value={submitForm.state} onChange={e => setSubmitForm((p: any) => ({ ...p, state: e.target.value }))} className={inputCls} placeholder="e.g. CA" data-testid="submit-state" />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select value={submitForm.applicationType} onChange={e => setSubmitForm((p: any) => ({ ...p, applicationType: e.target.value }))} className={inputCls} data-testid="submit-app-type">
            <option value="personal">Personal</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>
      <div className="mb-3">
        <label className={labelCls}>Notes</label>
        <textarea value={submitForm.notes} onChange={e => setSubmitForm((p: any) => ({ ...p, notes: e.target.value }))} className={`${inputCls} h-[60px] resize-none`} placeholder="Additional context..." data-testid="submit-notes" />
      </div>
      <div className="mb-3">
        <label className={labelCls}>Source URL</label>
        <input value={submitForm.sourceUrl} onChange={e => setSubmitForm((p: any) => ({ ...p, sourceUrl: e.target.value }))} className={inputCls} placeholder="https://..." data-testid="submit-source-url" />
      </div>
      <button
        onClick={handleSubmit}
        disabled={!submitForm.lender || submitting}
        className="w-full py-2.5 bg-[#111] text-white text-[12px] font-semibold rounded-lg hover:bg-[#222] disabled:opacity-40 transition-colors"
        data-testid="button-submit-dp"
      >{submitting ? "Submitting..." : "Submit Data Point"}</button>
      <p className="text-[9px] text-[#bbb] text-center mt-2">Submissions are reviewed before appearing publicly (status: pending).</p>
    </div>
  );

  const editableExtractFields = ["lender", "product", "outcome", "limitAmount", "score", "income", "utilization", "inquiryCount", "bureauPulled", "state", "applicationType", "notes"];

  const ExtractSection = () => (
    <div data-testid="unlocks-extract">
      <p className="text-[11px] text-[#555] mb-3">Paste a Reddit or myFICO post and let AI extract structured data.</p>
      <textarea
        value={extractText}
        onChange={e => setExtractText(e.target.value)}
        className={`${inputCls} h-[120px] resize-none mb-3`}
        placeholder="Paste community post text here..."
        data-testid="extract-text-input"
      />
      <button
        onClick={handleExtract}
        disabled={extractText.length < 20 || extracting}
        className="w-full py-2.5 bg-[#111] text-white text-[12px] font-semibold rounded-lg hover:bg-[#222] disabled:opacity-40 transition-colors mb-4"
        data-testid="button-extract"
      >{extracting ? "Extracting..." : "Extract with AI"}</button>

      {extractResult && (
        <div className="p-3 bg-[#fafafa] border border-[#eee] rounded-lg">
          <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wider mb-2">Extracted Data — Review & Edit</p>
          <div className="space-y-2 mb-3">
            {editableExtractFields.map(key => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-[10px] text-[#999] capitalize w-[90px] shrink-0">{key.replace(/([A-Z])/g, " $1").trim()}</label>
                {key === "outcome" ? (
                  <select
                    value={extractResult[key] || ""}
                    onChange={e => setExtractResult({ ...extractResult, [key]: e.target.value })}
                    className={`${inputCls} flex-1`}
                    data-testid={`extract-edit-${key}`}
                  >
                    <option value="approval">Approval</option>
                    <option value="denial">Denial</option>
                    <option value="reconsideration">Reconsideration</option>
                    <option value="cli">CLI</option>
                    <option value="product_change">Product Change</option>
                  </select>
                ) : key === "applicationType" ? (
                  <select
                    value={extractResult[key] || "personal"}
                    onChange={e => setExtractResult({ ...extractResult, [key]: e.target.value })}
                    className={`${inputCls} flex-1`}
                    data-testid={`extract-edit-${key}`}
                  >
                    <option value="personal">Personal</option>
                    <option value="business">Business</option>
                  </select>
                ) : (
                  <input
                    type={["limitAmount", "score", "income", "utilization", "inquiryCount"].includes(key) ? "number" : "text"}
                    value={extractResult[key] ?? ""}
                    onChange={e => setExtractResult({ ...extractResult, [key]: e.target.value || null })}
                    className={`${inputCls} flex-1`}
                    placeholder={extractResult[key] === null ? "Unknown" : ""}
                    data-testid={`extract-edit-${key}`}
                  />
                )}
              </div>
            ))}
          </div>
          {extractResult.aiSummary && (
            <div className="mb-3 p-2 bg-white rounded border border-[#eee]">
              <p className="text-[9px] text-[#999] font-medium mb-1">AI Summary</p>
              <p className="text-[10px] text-[#333]">{extractResult.aiSummary}</p>
            </div>
          )}
          <button
            onClick={handleSaveExtracted}
            disabled={submitting}
            className="w-full py-2 bg-[#2d6a4f] text-white text-[11px] font-semibold rounded-lg hover:bg-[#245a42] disabled:opacity-40 transition-colors"
            data-testid="button-save-extracted"
          >{submitting ? "Saving..." : "Save to Database"}</button>
        </div>
      )}
    </div>
  );

  return (
    <div data-testid="community-unlocks-view">
      <div className="mb-4">
        <h2 className="text-[16px] font-semibold text-[#111] mb-1" data-testid="text-unlocks-title">Reddit / myFICO Unlocks</h2>
        <p className="text-[11px] text-[#777] leading-[1.5] mb-2">Explore community-sourced approval and denial data points organized by lender, profile strength, and credit behavior.</p>
        <div className="px-2.5 py-1.5 bg-[#fffbeb] border border-[#fde68a] rounded-lg">
          <p className="text-[9px] text-[#92400e] leading-[1.5]" data-testid="text-unlocks-disclaimer">This section is for educational and analytical use only. Community data points do not guarantee approval outcomes. All data is community-sourced, manually entered, or AI-structured from submitted content.</p>
        </div>
      </div>

      <StatCards />
      <SectionNav />

      {activeSection === "browse" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <input
                value={filters.search}
                onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && fetchData()}
                placeholder="Search lender, product, bureau..."
                className="text-[11px] px-3 py-1.5 bg-[#f5f5f5] border border-[#eee] rounded-lg w-[200px] focus:outline-none focus:border-[#ccc]"
                data-testid="input-search"
              />
              <button onClick={() => setShowFilters(!showFilters)} className="px-2.5 py-1.5 text-[10px] font-medium text-[#555] bg-[#f5f5f5] border border-[#eee] rounded-lg hover:bg-[#eee]" data-testid="button-toggle-filters">
                Filters {showFilters ? "▲" : "▼"}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setViewMode("card")} className={`px-2 py-1 text-[10px] rounded ${viewMode === "card" ? "bg-[#111] text-white" : "text-[#555] bg-[#f5f5f5]"}`} data-testid="button-card-view">Cards</button>
              <button onClick={() => setViewMode("table")} className={`px-2 py-1 text-[10px] rounded ${viewMode === "table" ? "bg-[#111] text-white" : "text-[#555] bg-[#f5f5f5]"}`} data-testid="button-table-view">Table</button>
            </div>
          </div>
          <FilterPanel />
          {loading ? (
            <p className="text-[11px] text-[#999] text-center py-8">Loading data points...</p>
          ) : dataPoints.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[13px] text-[#555] mb-1">No data points found</p>
              <p className="text-[11px] text-[#999]">Try adjusting your filters or submit new data</p>
            </div>
          ) : (
            <>
              {viewMode === "card" ? (
                <div className="grid grid-cols-1 gap-2" data-testid="unlocks-card-grid">
                  {dataPoints.map(dp => <DataCard key={dp.id} dp={dp} />)}
                </div>
              ) : (
                <DataTable />
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#eee]">
                <span className="text-[10px] text-[#999]">{total} total · Page {page + 1}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-2.5 py-1 text-[10px] font-medium text-[#555] bg-[#f5f5f5] rounded disabled:opacity-30" data-testid="button-prev-page">Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 50 >= total} className="px-2.5 py-1 text-[10px] font-medium text-[#555] bg-[#f5f5f5] rounded disabled:opacity-30" data-testid="button-next-page">Next</button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeSection === "trends" && <TrendsSection />}
      {activeSection === "similar" && <SimilarSection />}
      {activeSection === "submit" && <SubmitSection />}
      {activeSection === "extract" && <ExtractSection />}

      <DetailModal />
    </div>
  );
}
