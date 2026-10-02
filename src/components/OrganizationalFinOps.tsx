import React, { useState } from 'react';
import { DepartmentBudget, OptimizationLevers, WorkloadProfile, LLMModel } from '../types/tokenomics';
import { INITIAL_DEPARTMENTS } from '../data/governanceAndRisks';
import { CalculationResult } from '../utils/calculator';
import { ROIProjection } from './ROIProjection';
import { Users, AlertCircle, CheckCircle2, ChevronRight, PieChart } from 'lucide-react';

interface OrganizationalFinOpsProps {
  calcResult: CalculationResult;
  optimizationLevers?: OptimizationLevers;
  workload?: WorkloadProfile;
  primaryModel?: LLMModel;
}

export const OrganizationalFinOps: React.FC<OrganizationalFinOpsProps> = ({
  calcResult,
  optimizationLevers,
  workload,
  primaryModel,
}) => {
  const [departments, setDepartments] = useState<DepartmentBudget[]>(INITIAL_DEPARTMENTS);
  const [maturityChecks, setMaturityChecks] = useState<Record<string, boolean>>({
    'crawl-tagging': true,
    'crawl-alerts': true,
    'walk-caching': true,
    'walk-chargeback': false,
    'walk-cascading': true,
    'run-circuit-breakers': false,
    'run-semantic-cache': false,
    'run-unit-economics-kpi': true,
  });

  const toggleCheck = (id: string) => {
    setMaturityChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedChecksCount = Object.values(maturityChecks).filter(Boolean).length;
  const totalChecksCount = Object.keys(maturityChecks).length;
  const maturityScorePercent = Math.round((completedChecksCount / totalChecksCount) * 100);

  const formatUSD = (val: number): string => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 10_000) return `$${Math.round(val).toLocaleString()}`;
    return `$${val.toFixed(0)}`;
  };

  // Calculate allocated spend for each department based on the active workload calculation result
  const totalMonthlySpend = calcResult.optimizedMonthlyCost;

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
          <span>AI FinOps Governance</span>
          <span aria-hidden="true">·</span>
          <span>Departmental Chargeback</span>
          <span aria-hidden="true">·</span>
          <span>Maturity Framework</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Organizational FinOps &amp; Unit Economics Governance
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-3xl">
          Scaling generative AI across enterprise business units requires visibility, attribution, quota enforcement, and disciplined unit economics tracking to prevent budget overrun.
        </p>
      </div>

      {/* Organizational Challenges Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 block mb-1">
            Challenge 1: Shadow AI Spend
          </span>
          <h2 className="text-sm font-semibold text-white">Fragmented Vendor Accounts</h2>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Engineering teams create disparate API keys on employee corporate cards without centralized logging, missing corporate volume tier discounts (up to 35% off) and obscuring consolidated liability.
          </p>
          <div className="mt-3 text-[11px] font-mono text-cyan-400">
            Fix: Enforce single API Gateway proxy with unified auth &amp; telemetry.
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block mb-1">
            Challenge 2: Multi-Tenant Attribution
          </span>
          <h2 className="text-sm font-semibold text-white">Missing Token Tagging &amp; Showback</h2>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Finance receives a single aggregated $60,000 monthly invoice from foundation model providers with no metadata to attribute cost per customer tier, product feature, or internal department.
          </p>
          <div className="mt-3 text-[11px] font-mono text-cyan-400">
            Fix: Mandatory <code className="text-slate-200">X-Cost-Center</code> &amp; <code className="text-slate-200">X-Tenant-ID</code> headers on all gateway calls.
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
            Challenge 3: Unit Margins
          </span>
          <h2 className="text-sm font-semibold text-white">Negative Gross Margin Features</h2>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            SaaS companies bundle unconstrained AI features into standard $29/mo seats. Heavy users generating $45/mo in tokens silently destroy software gross margins.
          </p>
          <div className="mt-3 text-[11px] font-mono text-cyan-400">
            Fix: Track CPAU (Cost Per Active User) and enforce tiered token allowances.
          </div>
        </div>
      </div>

      {/* Dedicated ROI Projection Component */}
      <ROIProjection
        calcResult={calcResult}
        optimizationLevers={optimizationLevers}
        workload={workload}
        primaryModel={primaryModel}
        departments={departments}
      />


      {/* Departmental Chargeback Matrix & Allocation */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Departmental Token Quota &amp; Chargeback Ledger
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Allocated: <strong className="text-white font-semibold">{formatUSD(totalMonthlySpend)}/month</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-3">Department &amp; Owner</th>
                <th className="py-2.5 px-3">Primary Use Case</th>
                <th className="py-2.5 px-3 text-right">Workload Share</th>
                <th className="py-2.5 px-3 text-right">Attributed Spend</th>
                <th className="py-2.5 px-3 text-right">Monthly Cap</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {departments.map((dept) => {
                const attributedSpend = totalMonthlySpend * (dept.sharePercentage / 100);
                const utilizationOfCap = dept.monthlyBudgetUSD > 0 ? (attributedSpend / dept.monthlyBudgetUSD) * 100 : 0;
                const isOverBudget = attributedSpend > dept.monthlyBudgetUSD;
                const isNearingCap = utilizationOfCap >= 80 && !isOverBudget;

                return (
                  <tr key={dept.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{dept.name}</div>
                      <div className="text-[11px] text-slate-400">{dept.owner}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                      {dept.primaryUseCase}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                      {dept.sharePercentage}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-cyan-400">
                      {formatUSD(attributedSpend)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-400">
                      {formatUSD(dept.monthlyBudgetUSD)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {isOverBudget ? (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                          <AlertCircle className="h-3 w-3" />
                          <span>Exceeded ({utilizationOfCap.toFixed(0)}%)</span>
                        </span>
                      ) : isNearingCap ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                          <span>Nearing Cap ({utilizationOfCap.toFixed(0)}%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Nominal ({utilizationOfCap.toFixed(0)}%)</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI FinOps Maturity Assessment (Crawl -> Walk -> Run) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Enterprise AI FinOps Maturity Checklist
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Self-audit your operational controls across the 3 standard FinOps lifecycle stages
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Readiness Score:</span>
            <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
              {maturityScorePercent}%
            </span>
            <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${maturityScorePercent}%` }}
                className="h-full bg-cyan-500 rounded-full transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stage 1: Crawl */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                01
              </span>
              <span>Stage 1: Crawl (Visibility)</span>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maturityChecks['crawl-tagging']}
                  onChange={() => toggleCheck('crawl-tagging')}
                  className="mt-0.5 rounded accent-cyan-500 bg-slate-800 border-slate-700"
                />
                <div>
                  <span className="font-semibold block text-slate-200">Metadata Tagging</span>
                  <span className="text-[11px] text-slate-400">Tag every LLM call with user ID, department, and feature ID.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maturityChecks['crawl-alerts']}
                  onChange={() => toggleCheck('crawl-alerts')}
                  className="mt-0.5 rounded accent-cyan-500 bg-slate-800 border-slate-700"
                />
                <div>
                  <span className="font-semibold block text-slate-200">Daily Spend Alerts</span>
                  <span className="text-[11px] text-slate-400">Automated Slack/Email triggers when daily spend increases &gt;30% unexpectedly.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Stage 2: Walk */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                02
              </span>
              <span>Stage 2: Walk (Optimization)</span>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maturityChecks['walk-caching']}
                  onChange={() => toggleCheck('walk-caching')}
                  className="mt-0.5 rounded accent-cyan-500 bg-slate-800 border-slate-700"
                />
                <div>
                  <span className="font-semibold block text-slate-200">Mandatory Prompt Caching</span>
                  <span className="text-[11px] text-slate-400">All prompts &gt;1k tokens enforce static prefix structures for KV-cache reuse.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maturityChecks['walk-cascading']}
                  onChange={() => toggleCheck('walk-cascading')}
                  className="mt-0.5 rounded accent-cyan-500 bg-slate-800 border-slate-700"
                />
                <div>
                  <span className="font-semibold block text-slate-200">Cascaded Model Routing</span>
                  <span className="text-[11px] text-slate-400">Small models triage incoming requests before calling expensive reasoning models.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maturityChecks['walk-chargeback']}
                  onChange={() => toggleCheck('walk-chargeback')}
                  className="mt-0.5 rounded accent-cyan-500 bg-slate-800 border-slate-700"
                />
                <div>
                  <span className="font-semibold block text-slate-200">Departmental Chargeback</span>
                  <span className="text-[11px] text-slate-400">Internal billing transfers token costs directly to team P&amp;L accounts.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Stage 3: Run */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                03
              </span>
              <span>Stage 3: Run (Autonomous Guardrails)</span>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maturityChecks['run-circuit-breakers']}
                  onChange={() => toggleCheck('run-circuit-breakers')}
                  className="mt-0.5 rounded accent-cyan-500 bg-slate-800 border-slate-700"
                />
                <div>
                  <span className="font-semibold block text-slate-200">Autonomous Circuit Breakers</span>
                  <span className="text-[11px] text-slate-400">Instant gateway cutoff on runaway agent loops or Denial-of-Wallet spikes.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maturityChecks['run-semantic-cache']}
                  onChange={() => toggleCheck('run-semantic-cache')}
                  className="mt-0.5 rounded accent-cyan-500 bg-slate-800 border-slate-700"
                />
                <div>
                  <span className="font-semibold block text-slate-200">Semantic Vector Cache Gateway</span>
                  <span className="text-[11px] text-slate-400">Global similarity deduplication serving 15-25% queries at zero token fee.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maturityChecks['run-unit-economics-kpi']}
                  onChange={() => toggleCheck('run-unit-economics-kpi')}
                  className="mt-0.5 rounded accent-cyan-500 bg-slate-800 border-slate-700"
                />
                <div>
                  <span className="font-semibold block text-slate-200">Unit Economics in CI/CD</span>
                  <span className="text-[11px] text-slate-400">Pull requests fail tests if prompt modifications inflate token footprint by &gt;15%.</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
