export interface LLMModel {
  id: string;
  name: string;
  provider: 'Google' | 'Anthropic' | 'OpenAI' | 'DeepSeek' | 'Meta / OpenWeights';
  tier: 'triage' | 'workhorse' | 'reasoning';
  inputPricePerMillion: number; // USD per 1M tokens
  outputPricePerMillion: number; // USD per 1M tokens
  cachedInputPricePerMillion: number; // USD per 1M tokens (prompt caching)
  batchDiscountPercentage: number; // e.g. 50% discount
  contextWindowTokens: number;
  typicalTTFTMs: number; // Time to First Token (ms)
  typicalThroughputTokensPerSec: number; // Output speed (tokens/sec)
  description: string;
  isRecommendedTier1?: boolean;
}

export interface WorkloadProfile {
  dailyQueries: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  multiTurnTurns: number; // average turns per session
  promptCacheHitRate: number; // 0 - 100%
  batchEligiblePercentage: number; // 0 - 100% of queries that can run asynchronously
  activeUsers: number;
  peakConcurrencyQPS: number;
}

export interface OptimizationLevers {
  enablePromptCaching: boolean;
  cacheHitRatio: number; // 0 - 90%
  enableCascading: boolean;
  cascadeTriageShare: number; // % of requests routed to fast cheap model (e.g. 70%)
  cascadeTriageModelId: string;
  enableBatchProcessing: boolean;
  batchShare: number; // % sent to batch API
  enableSemanticCache: boolean;
  semanticCacheHitRate: number; // % intercepted by vector cache (0 cost)
  enableOutputPruning: boolean;
  outputPruningReduction: number; // % reduction in output tokens via schema/stop tokens
}

export interface DepartmentBudget {
  id: string;
  name: string;
  owner: string;
  sharePercentage: number;
  monthlyBudgetUSD: number;
  primaryUseCase: string;
}

export interface HardwareProfile {
  name: string;
  gpuType: string;
  gpusPerNode: number;
  hourlyCostUSD: number;
  powerAndCoolingOverheadPercent: number; // e.g. 15%
  throughputTokensPerSecTotal: number;
  maxConcurrentStreams: number;
  fpPrecision: 'FP16' | 'FP8' | 'INT4';
  mlopsStaffCostPerMonthUSD: number;
}

export interface RiskScenario {
  id: string;
  title: string;
  category: 'Denial of Wallet' | 'Context Explosion' | 'Autonomous Runaway' | 'Contract Deflation';
  severity: 'Critical' | 'High' | 'Medium';
  vulnerabilityDescription: string;
  unmitigatedFinancialImpact: string;
  mitigationStrategy: string;
  technicalGuardrail: string;
}
