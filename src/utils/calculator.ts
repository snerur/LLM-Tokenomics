import { LLMModel, OptimizationLevers, WorkloadProfile, HardwareProfile } from '../types/tokenomics';

export interface CalculationResult {
  dailyInputTokens: number;
  dailyOutputTokens: number;
  monthlyInputTokens: number;
  monthlyOutputTokens: number;
  totalMonthlyTokens: number;
  
  // Baseline (Unoptimized)
  baselineDailyCost: number;
  baselineMonthlyCost: number;
  baselineAnnualCost: number;
  baselineCostPerThousandQueries: number;
  baselineCostPerActiveUserMonthly: number;

  // Optimized
  optimizedDailyCost: number;
  optimizedMonthlyCost: number;
  optimizedAnnualCost: number;
  optimizedCostPerThousandQueries: number;
  optimizedCostPerActiveUserMonthly: number;

  // Savings Breakdown
  monthlySavingsUSD: number;
  annualSavingsUSD: number;
  savingsPercentage: number;

  // Breakdown by optimization lever
  savingsPromptCaching: number;
  savingsCascading: number;
  savingsBatch: number;
  savingsSemanticCache: number;
  savingsOutputPruning: number;
}

export function calculateInferenceEconomics(
  workload: WorkloadProfile,
  primaryModel: LLMModel,
  triageModel: LLMModel,
  levers: OptimizationLevers
): CalculationResult {
  const DAYS_PER_MONTH = 30.416; // Standard average month

  // Base daily token volume (before optimizations)
  // Multi-turn sessions increase effective input tokens compounding across turns
  const compoundingMultiplier = 1 + (workload.multiTurnTurns - 1) * 0.45;
  const rawDailyInputTokens = workload.dailyQueries * workload.avgInputTokens * compoundingMultiplier;
  const rawDailyOutputTokens = workload.dailyQueries * workload.avgOutputTokens;

  // Monthly raw token volume
  const rawMonthlyInputTokens = rawDailyInputTokens * DAYS_PER_MONTH;
  const rawMonthlyOutputTokens = rawDailyOutputTokens * DAYS_PER_MONTH;
  const totalMonthlyTokens = rawMonthlyInputTokens + rawMonthlyOutputTokens;

  // BASELINE (UNOPTIMIZED) COST:
  // All queries go to primaryModel at standard un-cached, non-batch rates
  const baselineInputCostMonthly = (rawMonthlyInputTokens / 1_000_000) * primaryModel.inputPricePerMillion;
  const baselineOutputCostMonthly = (rawMonthlyOutputTokens / 1_000_000) * primaryModel.outputPricePerMillion;
  const baselineMonthlyCost = baselineInputCostMonthly + baselineOutputCostMonthly;
  const baselineDailyCost = baselineMonthlyCost / DAYS_PER_MONTH;
  const baselineAnnualCost = baselineMonthlyCost * 12;
  const baselineCostPerThousandQueries = (baselineMonthlyCost / (workload.dailyQueries * DAYS_PER_MONTH)) * 1000;
  const baselineCostPerActiveUserMonthly = workload.activeUsers > 0 ? baselineMonthlyCost / workload.activeUsers : 0;

  // OPTIMIZED COST PIPELINE:
  // Step 1: Semantic Vector Cache intercepts a percentage of queries at 0 token cost
  const semanticCacheRate = levers.enableSemanticCache ? (levers.semanticCacheHitRate / 100) : 0;
  const remainingQueryFractionAfterSemantic = Math.max(0, 1 - semanticCacheRate);

  // Queries needing LLM generation
  const activeMonthlyInputTokens = rawMonthlyInputTokens * remainingQueryFractionAfterSemantic;
  
  // Step 2: Output pruning reduces generated output token count
  const outputPruningReduction = levers.enableOutputPruning ? (levers.outputPruningReduction / 100) : 0;
  const activeMonthlyOutputTokens = rawMonthlyOutputTokens * remainingQueryFractionAfterSemantic * (1 - outputPruningReduction);

  // Step 3: Cascaded routing splits queries between triage model & primary model
  const cascadingEnabled = levers.enableCascading;
  const triageShare = cascadingEnabled ? (levers.cascadeTriageShare / 100) : 0;
  const primaryShare = 1 - triageShare;

  // Step 4: Prompt caching splits input tokens into Cached vs Uncached
  const cachingEnabled = levers.enablePromptCaching;
  const cacheHitRatio = cachingEnabled ? (levers.cacheHitRatio / 100) : 0;

  // Step 5: Batch API discount on eligible queries
  const batchEnabled = levers.enableBatchProcessing;
  const batchShare = batchEnabled ? (levers.batchShare / 100) : 0;

  // Calculate Cost for Primary Model Portion:
  const primaryInputTokens = activeMonthlyInputTokens * primaryShare;
  const primaryOutputTokens = activeMonthlyOutputTokens * primaryShare;

  const primaryCachedInputTokens = primaryInputTokens * cacheHitRatio;
  const primaryFreshInputTokens = primaryInputTokens * (1 - cacheHitRatio);

  const primaryInputCost =
    (primaryCachedInputTokens / 1_000_000) * primaryModel.cachedInputPricePerMillion +
    (primaryFreshInputTokens / 1_000_000) * primaryModel.inputPricePerMillion;

  let primaryOutputCost = (primaryOutputTokens / 1_000_000) * primaryModel.outputPricePerMillion;

  // Apply batch discount to the eligible share
  if (batchEnabled && primaryModel.batchDiscountPercentage > 0) {
    const batchDiscountFactor = 1 - (primaryModel.batchDiscountPercentage / 100);
    const standardShare = 1 - batchShare;
    const effectiveMultiplier = standardShare + batchShare * batchDiscountFactor;
    // Batch discount applies to input and output
    // Re-adjust
  }

  // Calculate Cost for Triage Model Portion:
  let triageTotalCost = 0;
  if (cascadingEnabled && triageShare > 0) {
    const triageInputTokens = activeMonthlyInputTokens * triageShare;
    const triageOutputTokens = activeMonthlyOutputTokens * triageShare;

    const triageCachedInput = triageInputTokens * cacheHitRatio;
    const triageFreshInput = triageInputTokens * (1 - cacheHitRatio);

    const triageInputCost =
      (triageCachedInput / 1_000_000) * triageModel.cachedInputPricePerMillion +
      (triageFreshInput / 1_000_000) * triageModel.inputPricePerMillion;

    const triageOutputCost = (triageOutputTokens / 1_000_000) * triageModel.outputPricePerMillion;
    triageTotalCost = triageInputCost + triageOutputCost;
  }

  // Combined cost before batch discount
  const combinedPreBatch = primaryInputCost + primaryOutputCost + triageTotalCost;

  // Apply batch discount on combined
  let optimizedMonthlyCost = combinedPreBatch;
  if (batchEnabled && batchShare > 0) {
    const avgBatchDiscount = (primaryModel.batchDiscountPercentage + triageModel.batchDiscountPercentage) / 200;
    const batchSavingsFactor = batchShare * avgBatchDiscount;
    optimizedMonthlyCost = combinedPreBatch * (1 - batchSavingsFactor);
  }

  const optimizedDailyCost = optimizedMonthlyCost / DAYS_PER_MONTH;
  const optimizedAnnualCost = optimizedMonthlyCost * 12;
  const optimizedCostPerThousandQueries = (optimizedMonthlyCost / (workload.dailyQueries * DAYS_PER_MONTH)) * 1000;
  const optimizedCostPerActiveUserMonthly = workload.activeUsers > 0 ? optimizedMonthlyCost / workload.activeUsers : 0;

  const monthlySavingsUSD = Math.max(0, baselineMonthlyCost - optimizedMonthlyCost);
  const annualSavingsUSD = monthlySavingsUSD * 12;
  const savingsPercentage = baselineMonthlyCost > 0 ? (monthlySavingsUSD / baselineMonthlyCost) * 100 : 0;

  // Individual lever savings attribution (estimated for waterfall breakdown)
  const savingsSemanticCache = baselineMonthlyCost * semanticCacheRate;
  const savingsPromptCaching = baselineInputCostMonthly * (1 - semanticCacheRate) * cacheHitRatio * 0.75;
  const savingsCascading = cascadingEnabled ? (baselineMonthlyCost - (triageTotalCost / triageShare)) * triageShare * 0.55 : 0;
  const savingsOutputPruning = baselineOutputCostMonthly * outputPruningReduction;
  const savingsBatch = batchEnabled ? baselineMonthlyCost * batchShare * 0.40 : 0;

  return {
    dailyInputTokens: rawDailyInputTokens,
    dailyOutputTokens: rawDailyOutputTokens,
    monthlyInputTokens: rawMonthlyInputTokens,
    monthlyOutputTokens: rawMonthlyOutputTokens,
    totalMonthlyTokens,
    baselineDailyCost,
    baselineMonthlyCost,
    baselineAnnualCost,
    baselineCostPerThousandQueries,
    baselineCostPerActiveUserMonthly,
    optimizedDailyCost,
    optimizedMonthlyCost,
    optimizedAnnualCost,
    optimizedCostPerThousandQueries,
    optimizedCostPerActiveUserMonthly,
    monthlySavingsUSD,
    annualSavingsUSD,
    savingsPercentage,
    savingsPromptCaching,
    savingsCascading: Math.max(0, savingsCascading),
    savingsBatch,
    savingsSemanticCache,
    savingsOutputPruning,
  };
}

export interface BreakevenPoint {
  crossoverDailyQueries: number;
  crossoverDailyTokensMillion: number;
  monthlyDedicatedCostUSD: number;
  monthlyApiCostUSD: number;
  recommendedDeployment: 'SaaS Token API' | 'Self-Hosted Dedicated GPU Cluster' | 'Hybrid Elastic';
  summaryRationale: string;
}

export function calculateSelfHostedBreakeven(
  hardware: HardwareProfile,
  workload: WorkloadProfile,
  apiModel: LLMModel,
  clusterNodeCount: number,
  averageGpuUtilizationPercent: number
): BreakevenPoint {
  const HOURS_PER_MONTH = 730;

  // Fixed monthly hardware cost per node (Compute + Power/Cooling overhead + SRE staffing fraction)
  const nodeHourlyLoaded = hardware.hourlyCostUSD * (1 + hardware.powerAndCoolingOverheadPercent / 100);
  const nodeMonthlyCompute = nodeHourlyLoaded * HOURS_PER_MONTH * clusterNodeCount;
  const monthlyDedicatedCostUSD = nodeMonthlyCompute + hardware.mlopsStaffCostPerMonthUSD;

  // Total token capacity per month of this cluster at given utilization
  const totalClusterThroughputTokensPerSec = hardware.throughputTokensPerSecTotal * clusterNodeCount;
  const effectiveTokensPerSec = totalClusterThroughputTokensPerSec * (averageGpuUtilizationPercent / 100);
  const clusterMonthlyTokenCapacity = effectiveTokensPerSec * 3600 * 24 * 30.416;

  // Average blended API price per 1M tokens for the equivalent model
  const blendedApiPricePerMillion = (apiModel.inputPricePerMillion * 0.75 + apiModel.outputPricePerMillion * 0.25);

  // Break-even token volume: At what monthly token volume does API cost equal Dedicated Hardware cost?
  // monthlyDedicatedCostUSD = (BreakEvenMonthlyTokens / 1_000_000) * blendedApiPricePerMillion
  const breakevenMonthlyTokens = (monthlyDedicatedCostUSD / blendedApiPricePerMillion) * 1_000_000;
  const crossoverDailyTokensMillion = (breakevenMonthlyTokens / 30.416) / 1_000_000;
  
  const avgTokensPerQuery = workload.avgInputTokens + workload.avgOutputTokens;
  const crossoverDailyQueries = Math.round((crossoverDailyTokensMillion * 1_000_000) / avgTokensPerQuery);

  // Current workload monthly API cost for this volume
  const currentWorkloadMonthlyTokens = (workload.dailyQueries * avgTokensPerQuery * 30.416);
  const monthlyApiCostUSD = (currentWorkloadMonthlyTokens / 1_000_000) * blendedApiPricePerMillion;

  let recommendedDeployment: 'SaaS Token API' | 'Self-Hosted Dedicated GPU Cluster' | 'Hybrid Elastic' = 'SaaS Token API';
  let summaryRationale = '';

  if (currentWorkloadMonthlyTokens < breakevenMonthlyTokens * 0.7) {
    recommendedDeployment = 'SaaS Token API';
    summaryRationale = `Your current monthly volume (${(currentWorkloadMonthlyTokens / 1_000_000).toFixed(0)}M tokens) is well below the breakeven threshold of ${(breakevenMonthlyTokens / 1_000_000).toFixed(0)}M tokens. Dedicated GPUs would suffer from low utilization and high SRE overhead.`;
  } else if (currentWorkloadMonthlyTokens > breakevenMonthlyTokens * 1.3) {
    recommendedDeployment = 'Self-Hosted Dedicated GPU Cluster';
    summaryRationale = `Your volume (${(currentWorkloadMonthlyTokens / 1_000_000).toFixed(0)}M tokens/mo) surpasses breakeven (${(breakevenMonthlyTokens / 1_000_000).toFixed(0)}M tokens/mo). Dedicated ${hardware.name} instances yield significant TCO savings if maintained at high utilization.`;
  } else {
    recommendedDeployment = 'Hybrid Elastic';
    summaryRationale = `Volume is near the financial breakeven boundary (${(breakevenMonthlyTokens / 1_000_000).toFixed(0)}M tokens/mo). Host predictable baseline load (40-60%) on reserved GPU nodes, and spill peak bursts onto serverless token APIs.`;
  }

  return {
    crossoverDailyQueries,
    crossoverDailyTokensMillion,
    monthlyDedicatedCostUSD,
    monthlyApiCostUSD,
    recommendedDeployment,
    summaryRationale,
  };
}
