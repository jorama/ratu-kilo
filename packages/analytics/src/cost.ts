// =========================
// COST CALCULATOR
// =========================

export interface PricingModel {
  name: string;
  inputTokenPrice: number; // per 1M tokens
  outputTokenPrice: number; // per 1M tokens
  embeddingPrice?: number; // per 1M tokens
}

export interface CostBreakdown {
  inputTokens: number;
  outputTokens: number;
  embeddings: number;
  inputCost: number;
  outputCost: number;
  embeddingCost: number;
  totalCost: number;
}

export class CostCalculator {
  private models: Map<string, PricingModel> = new Map();

  constructor() {
    // Initialize with common model pricing
    this.addModel({
      name: 'kimi-k2-128k',
      inputTokenPrice: 0.50, // $0.50 per 1M tokens (example)
      outputTokenPrice: 1.50, // $1.50 per 1M tokens (example)
    });

    this.addModel({
      name: 'gpt-4-turbo',
      inputTokenPrice: 10.00,
      outputTokenPrice: 30.00,
    });

    this.addModel({
      name: 'gpt-3.5-turbo',
      inputTokenPrice: 0.50,
      outputTokenPrice: 1.50,
    });

    this.addModel({
      name: 'text-embedding-3-large',
      inputTokenPrice: 0,
      outputTokenPrice: 0,
      embeddingPrice: 0.13, // $0.13 per 1M tokens
    });

    this.addModel({
      name: 'text-embedding-ada-002',
      inputTokenPrice: 0,
      outputTokenPrice: 0,
      embeddingPrice: 0.10,
    });
  }

  /**
   * Add or update pricing model
   */
  addModel(model: PricingModel): void {
    this.models.set(model.name, model);
  }

  /**
   * Get pricing model
   */
  getModel(name: string): PricingModel | undefined {
    return this.models.get(name);
  }

  /**
   * Calculate cost for tokens
   */
  calculateTokenCost(
    modelName: string,
    inputTokens: number,
    outputTokens: number
  ): { inputCost: number; outputCost: number; totalCost: number } {
    const model = this.models.get(modelName);
    
    if (!model) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    const inputCost = (inputTokens / 1_000_000) * model.inputTokenPrice;
    const outputCost = (outputTokens / 1_000_000) * model.outputTokenPrice;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
    };
  }

  /**
   * Calculate embedding cost
   */
  calculateEmbeddingCost(modelName: string, tokens: number): number {
    const model = this.models.get(modelName);
    
    if (!model || !model.embeddingPrice) {
      throw new Error(`Unknown embedding model: ${modelName}`);
    }

    return (tokens / 1_000_000) * model.embeddingPrice;
  }

  /**
   * Calculate complete cost breakdown
   */
  calculateBreakdown(
    llmModel: string,
    embeddingModel: string,
    inputTokens: number,
    outputTokens: number,
    embeddingTokens: number
  ): CostBreakdown {
    const tokenCost = this.calculateTokenCost(llmModel, inputTokens, outputTokens);
    const embeddingCost = embeddingTokens > 0 
      ? this.calculateEmbeddingCost(embeddingModel, embeddingTokens)
      : 0;

    return {
      inputTokens,
      outputTokens,
      embeddings: embeddingTokens,
      inputCost: tokenCost.inputCost,
      outputCost: tokenCost.outputCost,
      embeddingCost,
      totalCost: tokenCost.totalCost + embeddingCost,
    };
  }

  /**
   * Estimate monthly cost
   */
  estimateMonthlyCost(
    llmModel: string,
    embeddingModel: string,
    dailyQueries: number,
    avgInputTokens: number,
    avgOutputTokens: number,
    avgEmbeddingTokens: number
  ): {
    daily: number;
    monthly: number;
    breakdown: CostBreakdown;
  } {
    const breakdown = this.calculateBreakdown(
      llmModel,
      embeddingModel,
      avgInputTokens * dailyQueries,
      avgOutputTokens * dailyQueries,
      avgEmbeddingTokens * dailyQueries
    );

    return {
      daily: breakdown.totalCost,
      monthly: breakdown.totalCost * 30,
      breakdown,
    };
  }

  /**
   * Calculate cost per query
   */
  costPerQuery(
    llmModel: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const cost = this.calculateTokenCost(llmModel, inputTokens, outputTokens);
    return cost.totalCost;
  }

  /**
   * Get all available models
   */
  getAvailableModels(): PricingModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Compare costs between models
   */
  compareModels(
    models: string[],
    inputTokens: number,
    outputTokens: number
  ): Array<{ model: string; cost: number }> {
    return models.map(model => ({
      model,
      cost: this.calculateTokenCost(model, inputTokens, outputTokens).totalCost,
    })).sort((a, b) => a.cost - b.cost);
  }
}

// =========================
// USAGE TRACKER
// =========================

export interface UsageRecord {
  orgId: string;
  date: Date;
  queries: number;
  inputTokens: number;
  outputTokens: number;
  embeddingTokens: number;
  cost: number;
}

export class UsageTracker {
  private records: UsageRecord[] = [];
  private calculator: CostCalculator;

  constructor(calculator?: CostCalculator) {
    this.calculator = calculator || new CostCalculator();
  }

  /**
   * Record usage
   */
  record(
    orgId: string,
    llmModel: string,
    embeddingModel: string,
    inputTokens: number,
    outputTokens: number,
    embeddingTokens: number = 0
  ): void {
    const breakdown = this.calculator.calculateBreakdown(
      llmModel,
      embeddingModel,
      inputTokens,
      outputTokens,
      embeddingTokens
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's record
    let record = this.records.find(
      r => r.orgId === orgId && r.date.getTime() === today.getTime()
    );

    if (!record) {
      record = {
        orgId,
        date: today,
        queries: 0,
        inputTokens: 0,
        outputTokens: 0,
        embeddingTokens: 0,
        cost: 0,
      };
      this.records.push(record);
    }

    // Update record
    record.queries++;
    record.inputTokens += inputTokens;
    record.outputTokens += outputTokens;
    record.embeddingTokens += embeddingTokens;
    record.cost += breakdown.totalCost;
  }

  /**
   * Get usage for date range
   */
  getUsage(orgId: string, startDate: Date, endDate: Date): UsageRecord[] {
    return this.records.filter(
      r => r.orgId === orgId && r.date >= startDate && r.date <= endDate
    );
  }

  /**
   * Get total cost for period
   */
  getTotalCost(orgId: string, startDate: Date, endDate: Date): number {
    return this.getUsage(orgId, startDate, endDate)
      .reduce((sum, r) => sum + r.cost, 0);
  }

  /**
   * Get monthly usage
   */
  getMonthlyUsage(orgId: string, year: number, month: number): UsageRecord[] {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return this.getUsage(orgId, startDate, endDate);
  }
}

// =========================
// FACTORY FUNCTIONS
// =========================

export function createCostCalculator(): CostCalculator {
  return new CostCalculator();
}

export function createUsageTracker(calculator?: CostCalculator): UsageTracker {
  return new UsageTracker(calculator);
}