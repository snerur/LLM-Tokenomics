import { WorkloadProfile } from '../types/tokenomics';

export interface WorkloadPreset {
  id: string;
  title: string;
  category: string;
  description: string;
  profile: WorkloadProfile;
  recommendedModelId: string;
  primaryCostDriver: string;
  recommendedOptimization: string;
}

export const WORKLOAD_PRESETS: WorkloadPreset[] = [
  {
    id: 'customer-support-rag',
    title: 'Customer Experience & RAG Agent',
    category: 'Conversational Support',
    description: 'High query volume answering customer tickets using dynamic retrieval with large enterprise knowledge base snippets.',
    profile: {
      dailyQueries: 250000,
      avgInputTokens: 3200,
      avgOutputTokens: 450,
      multiTurnTurns: 4,
      promptCacheHitRate: 75,
      batchEligiblePercentage: 10,
      activeUsers: 85000,
      peakConcurrencyQPS: 45,
    },
    recommendedModelId: 'gemini-2-flash',
    primaryCostDriver: 'Repeated system prompt and enterprise documentation context injection across conversational turns.',
    recommendedOptimization: 'Enable KV prompt caching for static KB prefixes and deploy a 2-tier classifier to route routine queries to Flash/Haiku.',
  },
  {
    id: 'code-copilot-ci',
    title: 'Code Copilot & CI Pull Request Reviewer',
    category: 'Engineering Tools',
    description: 'Developer IDE completions and automated PR analysis parsing multi-file diffs and lint logs.',
    profile: {
      dailyQueries: 80000,
      avgInputTokens: 7500,
      avgOutputTokens: 850,
      multiTurnTurns: 2,
      promptCacheHitRate: 60,
      batchEligiblePercentage: 45,
      activeUsers: 4200,
      peakConcurrencyQPS: 28,
    },
    recommendedModelId: 'claude-3-5-sonnet',
    primaryCostDriver: 'Large code context windows (repository files, AST outlines) ingested repeatedly during build cycles.',
    recommendedOptimization: 'Offload nightly CI reviews to Batch API (50% discount) and enforce diff context pruning.',
  },
  {
    id: 'legal-financial-audit',
    title: 'Contract Analysis & Financial Due Diligence',
    category: 'Document Intelligence',
    description: 'Deep reasoning across 100+ page contracts, 10-K filings, and regulatory guidelines requiring ultra-low hallucination.',
    profile: {
      dailyQueries: 12000,
      avgInputTokens: 45000,
      avgOutputTokens: 2800,
      multiTurnTurns: 1,
      promptCacheHitRate: 85,
      batchEligiblePercentage: 60,
      activeUsers: 650,
      peakConcurrencyQPS: 8,
    },
    recommendedModelId: 'gemini-1-5-pro',
    primaryCostDriver: 'Massive input token payload per document analysis and high reasoning chain-of-thought generation.',
    recommendedOptimization: 'Persistent context caching on 10-K/contract corpora, async batch scheduling for non-urgent document queues.',
  },
  {
    id: 'autonomous-agent-swarm',
    title: 'Autonomous Multi-Agent Market Intelligence',
    category: 'Agentic Workflows',
    description: 'Swarm of specialized agents searching the web, executing code, and critiquing intermediate outputs iteratively.',
    profile: {
      dailyQueries: 15000,
      avgInputTokens: 8500,
      avgOutputTokens: 3200,
      multiTurnTurns: 14,
      promptCacheHitRate: 40,
      batchEligiblePercentage: 20,
      activeUsers: 300,
      peakConcurrencyQPS: 12,
    },
    recommendedModelId: 'claude-3-5-sonnet',
    primaryCostDriver: 'Quadratic context growth compounding across 14+ recursive tool-calling steps.',
    recommendedOptimization: 'Context compaction (summarizing past tool steps), strict step caps (max 8 iterations), and hard budget killswitches.',
  },
  {
    id: 'high-scale-moderation',
    title: 'High-Volume UGC Moderation & Categorization',
    category: 'Content Classification',
    description: 'Real-time safety checks, sentiment scoring, and metadata tagging on millions of user posts and comments.',
    profile: {
      dailyQueries: 1500000,
      avgInputTokens: 350,
      avgOutputTokens: 60,
      multiTurnTurns: 1,
      promptCacheHitRate: 20,
      batchEligiblePercentage: 70,
      activeUsers: 450000,
      peakConcurrencyQPS: 180,
    },
    recommendedModelId: 'gpt-4o-mini',
    primaryCostDriver: 'Pure query volume scale ($0.15/1M adds up at 1.5B tokens/month).',
    recommendedOptimization: 'Semantic caching of identical phrases, strict JSON integer enums (1 token output), or fine-tuned self-hosted Llama 8B.',
  },
];
