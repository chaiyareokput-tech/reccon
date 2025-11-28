export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  reference?: string;
  source: 'BANK' | 'BOOK';
  originalRow?: any;
}

export enum MatchStatus {
  MATCHED = 'MATCHED',
  POTENTIAL = 'POTENTIAL',
  UNMATCHED = 'UNMATCHED',
}

export interface MatchResult {
  id: string;
  bankTx?: Transaction;
  bookTx?: Transaction;
  status: MatchStatus;
  confidence: number; // 0-100
  note?: string; // Reason for match or mismatch
  aiSuggestion?: string; // Suggestion from Gemini
}

export interface ReconciliationSummary {
  totalBank: number;
  totalBook: number;
  matchedCount: number;
  potentialCount: number;
  unmatchedBankCount: number;
  unmatchedBookCount: number;
}
