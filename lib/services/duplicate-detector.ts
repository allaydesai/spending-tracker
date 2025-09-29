import { TransactionInput } from '@/lib/types/transaction';
import { TransactionService } from './transaction-service';

export interface DuplicateMatch {
  existingId: number;
  input: TransactionInput;
  confidence: number; // 0-1 scale
  matchType: 'exact' | 'fuzzy';
  matchedFields: string[];
}

export interface DuplicateDetectionOptions {
  exactMatch?: boolean;
  fuzzyMatching?: boolean;
  fuzzyThreshold?: number; // 0-1 scale for fuzzy matching
  dateToleranceDays?: number; // Days tolerance for date matching
  amountTolerancePercent?: number; // Percentage tolerance for amount matching
  descriptionSimilarityThreshold?: number; // 0-1 scale for description similarity
}

export class DuplicateDetector {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  /**
   * Detect duplicates for a single transaction input
   */
  async detectDuplicates(
    input: TransactionInput,
    options: DuplicateDetectionOptions = {}
  ): Promise<DuplicateMatch[]> {
    const {
      exactMatch = true,
      fuzzyMatching = false,
      fuzzyThreshold = 0.8,
      dateToleranceDays = 0,
      amountTolerancePercent = 0,
      descriptionSimilarityThreshold = 0.85
    } = options;

    const matches: DuplicateMatch[] = [];

    try {
      // First, check for exact matches
      if (exactMatch) {
        const exactMatchId = await this.transactionService.checkTransactionExists(
          input.date,
          input.amount,
          input.description
        );

        if (exactMatchId) {
          matches.push({
            existingId: exactMatchId,
            input,
            confidence: 1.0,
            matchType: 'exact',
            matchedFields: ['date', 'amount', 'description']
          });
        }
      }

      // If no exact match and fuzzy matching is enabled, look for fuzzy matches
      if (matches.length === 0 && fuzzyMatching) {
        const fuzzyMatches = await this.findFuzzyMatches(
          input,
          dateToleranceDays,
          amountTolerancePercent,
          descriptionSimilarityThreshold
        );

        // Filter matches by confidence threshold
        const qualifiedMatches = fuzzyMatches.filter(match => match.confidence >= fuzzyThreshold);
        matches.push(...qualifiedMatches);
      }

      return matches.sort((a, b) => b.confidence - a.confidence);
    } catch (error: any) {
      console.error('Error detecting duplicates:', error);
      return [];
    }
  }

  /**
   * Detect duplicates for multiple transaction inputs
   */
  async detectBulkDuplicates(
    inputs: TransactionInput[],
    options: DuplicateDetectionOptions = {}
  ): Promise<Map<TransactionInput, DuplicateMatch[]>> {
    const duplicateMap = new Map<TransactionInput, DuplicateMatch[]>();

    // Also check for duplicates within the batch itself
    const internalDuplicates = this.findInternalDuplicates(inputs);

    for (const input of inputs) {
      const matches = await this.detectDuplicates(input, options);

      // Add internal duplicates if any
      const internalMatch = internalDuplicates.get(input);
      if (internalMatch) {
        matches.push(internalMatch);
      }

      if (matches.length > 0) {
        duplicateMap.set(input, matches);
      }
    }

    return duplicateMap;
  }

  /**
   * Find fuzzy matches based on similarity algorithms
   */
  private async findFuzzyMatches(
    input: TransactionInput,
    dateToleranceDays: number,
    amountTolerancePercent: number,
    descriptionSimilarityThreshold: number
  ): Promise<DuplicateMatch[]> {
    const matches: DuplicateMatch[] = [];

    try {
      // Build date range for search
      const inputDate = new Date(input.date);
      const startDate = new Date(inputDate);
      startDate.setDate(startDate.getDate() - dateToleranceDays);
      const endDate = new Date(inputDate);
      endDate.setDate(endDate.getDate() + dateToleranceDays);

      // Get transactions in the date range
      const candidateTransactions = await this.transactionService.getTransactionsInDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        { limit: 1000 } // Reasonable limit for fuzzy matching
      );

      for (const candidate of candidateTransactions.data) {
        const matchResult = this.calculateSimilarity(
          input,
          candidate,
          dateToleranceDays,
          amountTolerancePercent,
          descriptionSimilarityThreshold
        );

        if (matchResult.confidence > 0) {
          matches.push({
            existingId: candidate.id,
            input,
            confidence: matchResult.confidence,
            matchType: 'fuzzy',
            matchedFields: matchResult.matchedFields
          });
        }
      }

      return matches;
    } catch (error: any) {
      console.error('Error finding fuzzy matches:', error);
      return [];
    }
  }

  /**
   * Calculate similarity between input and existing transaction
   */
  private calculateSimilarity(
    input: TransactionInput,
    existing: any,
    dateToleranceDays: number,
    amountTolerancePercent: number,
    descriptionSimilarityThreshold: number
  ): { confidence: number; matchedFields: string[] } {
    const matchedFields: string[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Date similarity (weight: 0.3)
    const dateWeight = 0.3;
    maxScore += dateWeight;
    const dateSimilarity = this.calculateDateSimilarity(input.date, existing.date, dateToleranceDays);
    if (dateSimilarity > 0) {
      totalScore += dateSimilarity * dateWeight;
      matchedFields.push('date');
    }

    // Amount similarity (weight: 0.4)
    const amountWeight = 0.4;
    maxScore += amountWeight;
    const amountSimilarity = this.calculateAmountSimilarity(input.amount, existing.amount, amountTolerancePercent);
    if (amountSimilarity > 0) {
      totalScore += amountSimilarity * amountWeight;
      matchedFields.push('amount');
    }

    // Description similarity (weight: 0.3)
    const descriptionWeight = 0.3;
    maxScore += descriptionWeight;
    const descriptionSimilarity = this.calculateStringSimilarity(input.description, existing.description);
    if (descriptionSimilarity >= descriptionSimilarityThreshold) {
      totalScore += descriptionSimilarity * descriptionWeight;
      matchedFields.push('description');
    }

    // Category similarity (bonus weight: 0.1 if both have categories)
    if (input.category && existing.category) {
      const categoryWeight = 0.1;
      maxScore += categoryWeight;
      const categorySimilarity = this.calculateStringSimilarity(input.category, existing.category);
      if (categorySimilarity > 0.8) {
        totalScore += categorySimilarity * categoryWeight;
        matchedFields.push('category');
      }
    }

    const confidence = maxScore > 0 ? totalScore / maxScore : 0;
    return { confidence, matchedFields };
  }

  /**
   * Calculate date similarity within tolerance
   */
  private calculateDateSimilarity(date1: string, date2: string, toleranceDays: number): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 1.0;
    if (diffDays <= toleranceDays) return 1.0 - (diffDays / toleranceDays) * 0.5;
    return 0;
  }

  /**
   * Calculate amount similarity within percentage tolerance
   */
  private calculateAmountSimilarity(amount1: number, amount2: number, tolerancePercent: number): number {
    if (amount1 === amount2) return 1.0;

    const diff = Math.abs(amount1 - amount2);
    const avg = (Math.abs(amount1) + Math.abs(amount2)) / 2;
    const percentDiff = avg > 0 ? (diff / avg) * 100 : 100;

    if (percentDiff <= tolerancePercent) {
      return 1.0 - (percentDiff / tolerancePercent) * 0.5;
    }

    return 0;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    if (maxLength === 0) return 1.0;

    return 1.0 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Find duplicates within the input batch itself
   */
  private findInternalDuplicates(inputs: TransactionInput[]): Map<TransactionInput, DuplicateMatch> {
    const duplicateMap = new Map<TransactionInput, DuplicateMatch>();
    const seen = new Map<string, TransactionInput>();

    for (const input of inputs) {
      const key = `${input.date}|${input.amount}|${input.description}`;

      if (seen.has(key)) {
        const original = seen.get(key)!;
        duplicateMap.set(input, {
          existingId: -1, // Indicates internal duplicate
          input: original,
          confidence: 1.0,
          matchType: 'exact',
          matchedFields: ['date', 'amount', 'description']
        });
      } else {
        seen.set(key, input);
      }
    }

    return duplicateMap;
  }

  /**
   * Get duplicate detection statistics
   */
  async getDuplicateStats(): Promise<{
    totalTransactions: number;
    potentialDuplicatePairs: number;
    exactDuplicates: number;
    fuzzyDuplicates: number;
  }> {
    try {
      const totalCount = await this.transactionService.getTransactionCount();

      // This is a simplified implementation
      // In a real system, you might want to store duplicate detection results
      // or run periodic duplicate analysis

      return {
        totalTransactions: totalCount,
        potentialDuplicatePairs: 0, // Would need more complex analysis
        exactDuplicates: 0, // Would need to be calculated
        fuzzyDuplicates: 0  // Would need to be calculated
      };
    } catch (error: any) {
      console.error('Error getting duplicate stats:', error);
      return {
        totalTransactions: 0,
        potentialDuplicatePairs: 0,
        exactDuplicates: 0,
        fuzzyDuplicates: 0
      };
    }
  }

  /**
   * Find potential duplicates in existing transaction data
   */
  async findPotentialDuplicates(
    options: DuplicateDetectionOptions & { limit?: number } = {}
  ): Promise<Array<{
    transaction1: any;
    transaction2: any;
    confidence: number;
    matchedFields: string[];
  }>> {
    const { limit = 100 } = options;
    const potentialDuplicates: Array<{
      transaction1: any;
      transaction2: any;
      confidence: number;
      matchedFields: string[];
    }> = [];

    try {
      // Get recent transactions for analysis
      const transactions = await this.transactionService.getTransactions({ limit: limit * 2 });

      // Compare each transaction with others
      for (let i = 0; i < transactions.data.length - 1; i++) {
        for (let j = i + 1; j < transactions.data.length; j++) {
          const t1 = transactions.data[i];
          const t2 = transactions.data[j];

          // Skip if same transaction
          if (t1.id === t2.id) continue;

          const similarity = this.calculateSimilarity(
            { date: t1.date, amount: t1.amount, description: t1.description, category: t1.category },
            t2,
            options.dateToleranceDays || 1,
            options.amountTolerancePercent || 5,
            options.descriptionSimilarityThreshold || 0.8
          );

          if (similarity.confidence >= (options.fuzzyThreshold || 0.7)) {
            potentialDuplicates.push({
              transaction1: t1,
              transaction2: t2,
              confidence: similarity.confidence,
              matchedFields: similarity.matchedFields
            });
          }

          // Limit results
          if (potentialDuplicates.length >= limit) {
            break;
          }
        }

        if (potentialDuplicates.length >= limit) {
          break;
        }
      }

      return potentialDuplicates.sort((a, b) => b.confidence - a.confidence);
    } catch (error: any) {
      console.error('Error finding potential duplicates:', error);
      return [];
    }
  }
}