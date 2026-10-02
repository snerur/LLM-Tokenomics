import React, { useState } from 'react';
import { LLMModel, OptimizationLevers, WorkloadProfile } from '../types/tokenomics';
import { CalculationResult } from '../utils/calculator';
import { X, Copy, Check, Printer, FileText } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workload: WorkloadProfile;
  primaryModel: LLMModel;
  triageModel: LLMModel;
  optimizationLevers: OptimizationLevers;
  calcResult: CalculationResult;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  workload,
  primaryModel,
  triageModel,
  optimizationLevers,
  calcResult,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formatUSD = (val: number): string => {
    return `$${Math.round(val).toLocaleString()}`;
  };

  const reportMarkdown = `# AI Inference Economics & FinOps Executive Report
Generated: ${new Date().toISOString().split('T')[0]}
Target Baseline Model: ${primaryModel.name} (${primaryModel.provider})

## 1. Executive Summary
- Current Unoptimized Monthly Spend: ${formatUSD(calcResult.baselineMonthlyCost)} / month
- Optimized Target Monthly Spend: ${formatUSD(calcResult.optimizedMonthlyCost)} / month
- Net Monthly Savings: ${formatUSD(calcResult.monthlySavingsUSD)} / month (${calcResult.savingsPercentage.toFixed(1)}% reduction)
- Annualized Projected Savings: ${formatUSD(calcResult.annualSavingsUSD)} / year
- Estimated FinOps Gateway Payback Period: ~${Math.max(1, Math.round(18000 / Math.max(1, calcResult.monthlySavingsUSD / 30.416)))} days
- Cost Per 1,000 Queries: $${calcResult.optimizedCostPerThousandQueries.toFixed(3)} (down from $${calcResult.baselineCostPerThousandQueries.toFixed(3)})

## 2. Workload Token Footprint
- Daily Query Volume: ${workload.dailyQueries.toLocaleString()} queries/day
- Average Input Payload: ${workload.avgInputTokens.toLocaleString()} tokens
- Average Output Generation: ${workload.avgOutputTokens.toLocaleString()} tokens
- Multi-Turn Session Compounding: ${workload.multiTurnTurns} turns/session
- Total Monthly Token Volume: ${(calcResult.totalMonthlyTokens / 1_000_000).toFixed(1)}M tokens/month
  - Input Tokens: ${(calcResult.monthlyInputTokens / 1_000_000).toFixed(1)}M tokens (${((calcResult.monthlyInputTokens / calcResult.totalMonthlyTokens) * 100).toFixed(0)}%)
  - Output Tokens: ${(calcResult.monthlyOutputTokens / 1_000_000).toFixed(1)}M tokens (${((calcResult.monthlyOutputTokens / calcResult.totalMonthlyTokens) * 100).toFixed(0)}%)

## 3. Cost Optimization Attribution
1. KV Prompt Caching (${optimizationLevers.enablePromptCaching ? 'ENABLED' : 'DISABLED'} @ ${optimizationLevers.cacheHitRatio}% hit rate): ${formatUSD(calcResult.savingsPromptCaching)}/mo
2. 2-Tier Cascaded Router (${optimizationLevers.enableCascading ? 'ENABLED' : 'DISABLED'} routing ${optimizationLevers.cascadeTriageShare}% to ${triageModel.name}): ${formatUSD(calcResult.savingsCascading)}/mo
3. Semantic Vector Cache (${optimizationLevers.enableSemanticCache ? 'ENABLED' : 'DISABLED'} @ ${optimizationLevers.semanticCacheHitRate}% hit rate): ${formatUSD(calcResult.savingsSemanticCache)}/mo
4. Batch API Offloading (${optimizationLevers.enableBatchProcessing ? 'ENABLED' : 'DISABLED'} @ ${optimizationLevers.batchShare}% volume): ${formatUSD(calcResult.savingsBatch)}/mo
5. Strict Output Pruning (${optimizationLevers.enableOutputPruning ? 'ENABLED' : 'DISABLED'} @ ${optimizationLevers.outputPruningReduction}% reduction): ${formatUSD(calcResult.savingsOutputPruning)}/mo

## 4. Organizational FinOps Policy Directives
- Attribution: Mandate X-Cost-Center and X-Tenant-ID headers across all LLM gateway calls.
- Circuit Breaker: Enforce max_tokens hard ceiling at 2,048 for standard user tiers.
- Autonomous Loop Governor: Terminate recursive tool-calling agents reaching >8 turns or >$2.00 per task.
- Procurement Strategy: Avoid multi-year fixed GPU/PTU commitments due to 60-80% annual token price deflation.
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              Executive FinOps Briefing &amp; Recommendations
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
          {reportMarkdown}
        </div>

        <div className="mt-4 flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Export format: Markdown · Ready for Notion, Confluence, or board decks
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 shadow-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-white" />
                  <span>Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
