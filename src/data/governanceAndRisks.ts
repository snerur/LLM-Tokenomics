import { DepartmentBudget, HardwareProfile, RiskScenario } from '../types/tokenomics';

export const INITIAL_DEPARTMENTS: DepartmentBudget[] = [
  {
    id: 'dept-support',
    name: 'Customer Support & CX',
    owner: 'VP Customer Experience',
    sharePercentage: 35,
    monthlyBudgetUSD: 25000,
    primaryUseCase: 'Tier-1 customer ticket resolution & conversational RAG portal',
  },
  {
    id: 'dept-eng',
    name: 'Software Engineering',
    owner: 'VP Engineering',
    sharePercentage: 30,
    monthlyBudgetUSD: 22000,
    primaryUseCase: 'Developer copilot, code generation, and automated PR review bots',
  },
  {
    id: 'dept-product',
    name: 'Product & Analytics',
    owner: 'Chief Product Officer',
    sharePercentage: 15,
    monthlyBudgetUSD: 12000,
    primaryUseCase: 'User feedback synthesis, competitor intelligence, feature extraction',
  },
  {
    id: 'dept-legal',
    name: 'Legal & Compliance',
    owner: 'General Counsel',
    sharePercentage: 12,
    monthlyBudgetUSD: 10000,
    primaryUseCase: 'Contract redlining, regulatory change tracking, compliance auditing',
  },
  {
    id: 'dept-marketing',
    name: 'Marketing & Content',
    owner: 'Chief Marketing Officer',
    sharePercentage: 8,
    monthlyBudgetUSD: 6000,
    primaryUseCase: 'SEO asset creation, localization, social copy generation',
  },
];

export const HARDWARE_BENCHMARKS: HardwareProfile[] = [
  {
    name: '8x NVIDIA H100 SXM5 (80GB)',
    gpuType: 'H100 SXM5',
    gpusPerNode: 8,
    hourlyCostUSD: 24.50, // Typical cloud rate on CoreWeave / RunPod / Lambda / GCP
    powerAndCoolingOverheadPercent: 12,
    throughputTokensPerSecTotal: 3400,
    maxConcurrentStreams: 180,
    fpPrecision: 'FP8',
    mlopsStaffCostPerMonthUSD: 14000, // Shared SRE / MLOps FTE fraction
  },
  {
    name: '4x NVIDIA L40S (48GB)',
    gpuType: 'L40S',
    gpusPerNode: 4,
    hourlyCostUSD: 6.80,
    powerAndCoolingOverheadPercent: 10,
    throughputTokensPerSecTotal: 1250,
    maxConcurrentStreams: 60,
    fpPrecision: 'FP8',
    mlopsStaffCostPerMonthUSD: 9000,
  },
  {
    name: '8x NVIDIA A100 SXM4 (80GB)',
    gpuType: 'A100 SXM4',
    gpusPerNode: 8,
    hourlyCostUSD: 16.00,
    powerAndCoolingOverheadPercent: 15,
    throughputTokensPerSecTotal: 1950,
    maxConcurrentStreams: 90,
    fpPrecision: 'FP16',
    mlopsStaffCostPerMonthUSD: 12000,
  },
];

export const RISK_SCENARIOS: RiskScenario[] = [
  {
    id: 'risk-dow',
    title: 'Denial of Wallet (DoW) & Prompt Injection Amplification',
    category: 'Denial of Wallet',
    severity: 'Critical',
    vulnerabilityDescription:
      "Malicious actors craft inputs instructing the model to generate maximum-length essays, repeated patterns, or endless translations (e.g. repeat the word 'company' 100,000 times with reasoning). An attacker issuing 500 concurrent requests can burn $12,000 in minutes on unthrottled frontier models.",
    unmitigatedFinancialImpact: '$10,000 – $75,000 / day in runaway token burst consumption.',
    mitigationStrategy:
      'Enforce hard max_tokens ceilings per endpoint, client-side IP/user rate limiting, semantic anomaly detection, and immediate circuit breakers on consecutive max-length responses.',
    technicalGuardrail: 'Gateway middleware rejecting unauthenticated payloads with max_tokens > 2,048 unless explicitly signed with elevated administrative privileges.',
  },
  {
    id: 'risk-context-quadratic',
    title: 'Quadratic Context Compounding in Long Sessions',
    category: 'Context Explosion',
    severity: 'High',
    vulnerabilityDescription:
      'In multi-turn chat applications, naïve client implementations re-send the entire conversation history on every message. Turn 1 sends 500 tokens; Turn 20 sends 35,000 tokens. The cost of a 20-turn session scales quadratically O(N^2) rather than linearly.',
    unmitigatedFinancialImpact: '400% to 750% higher blended input token costs compared to compacted sessions.',
    mitigationStrategy:
      'Implement sliding window truncation, automated conversational compaction (summarizing turns 1-15 into a concise 200-token memorandum), or KV prompt caching with strict session reset boundaries.',
    technicalGuardrail: 'Context Compactor middleware: automatically triggers an async flash summary when session history exceeds 8,000 tokens.',
  },
  {
    id: 'risk-autonomous-loop',
    title: 'Recursive Autonomous Agent Runaway Loops',
    category: 'Autonomous Runaway',
    severity: 'Critical',
    vulnerabilityDescription:
      'Autonomous agents equipped with tools (web search, Python interpreter, SQL) fail on subtle syntax errors or edge cases and enter an infinite retry loop without user intervention, making dozens of tool calls per second with compounding context.',
    unmitigatedFinancialImpact: '$1,500 – $8,000 per stalled worker process if unchecked over a weekend or holiday.',
    mitigationStrategy:
      'Enforce mandatory max_iterations = 8, per-task token budgets ($2.00 hard limit per goal), exponential backoff on repeated tool failure, and human-in-the-loop approval triggers.',
    technicalGuardrail: 'Execution Governor: State machine terminates any agent session reaching 10 iterations or accumulating > 80,000 cumulative tokens.',
  },
  {
    id: 'risk-contract-deflation',
    title: 'The AI Deflation Trap: Multi-Year GPU / PTU Commitments',
    category: 'Contract Deflation',
    severity: 'High',
    vulnerabilityDescription:
      'Token prices historically decline by 60% to 80% every 12 to 14 months due to architectural improvements (MoE, distillation, quantization). Organizations locking into 3-year fixed Provisioned Throughput (PTU) or dedicated GPU leases find themselves paying 3x market rate within 18 months.',
    unmitigatedFinancialImpact: '$250,000 – $1.2M in stranded compute capital above spot/serverless market rates.',
    mitigationStrategy:
      'Adopt a hybrid elasticity strategy: reserve baseline capacity (40%) on short 6-to-12 month contracts and handle burst spikes (60%) via serverless pay-per-token APIs with dynamic provider routing.',
    technicalGuardrail: 'FinOps Contract Renegotiation Cadence: Mandatory quarterly review of token unit economics vs reserved hardware TCO.',
  },
];
