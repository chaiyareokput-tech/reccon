import { Transaction, MatchResult, MatchStatus, ReconciliationSummary } from '../types';

export const reconcileData = (
  bankData: Transaction[], 
  bookData: Transaction[]
): { results: MatchResult[], summary: ReconciliationSummary } => {
  
  const results: MatchResult[] = [];
  const usedBookIds = new Set<string>();
  const usedBankIds = new Set<string>();

  // 1. Exact Match (Date, Amount)
  bankData.forEach(bankTx => {
    if (usedBankIds.has(bankTx.id)) return;

    const exactMatch = bookData.find(bookTx => 
      !usedBookIds.has(bookTx.id) &&
      bookTx.amount === bankTx.amount &&
      bookTx.date === bankTx.date
    );

    if (exactMatch) {
      results.push({
        id: `match-${bankTx.id}-${exactMatch.id}`,
        bankTx,
        bookTx: exactMatch,
        status: MatchStatus.MATCHED,
        confidence: 100,
        note: 'ตรงกันสมบูรณ์ (วันที่และยอดเงิน)'
      });
      usedBankIds.add(bankTx.id);
      usedBookIds.add(exactMatch.id);
    }
  });

  // 2. Fuzzy Match (Date Window +/- 3 days, Amount Match)
  bankData.forEach(bankTx => {
    if (usedBankIds.has(bankTx.id)) return;

    const bankDate = new Date(bankTx.date);
    
    const potentialMatch = bookData.find(bookTx => {
      if (usedBookIds.has(bookTx.id)) return false;
      if (bookTx.amount !== bankTx.amount) return false;
      
      const bookDate = new Date(bookTx.date);
      const diffTime = Math.abs(bookDate.getTime() - bankDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      return diffDays <= 3; // Allow 3 days difference
    });

    if (potentialMatch) {
      results.push({
        id: `match-${bankTx.id}-${potentialMatch.id}`,
        bankTx,
        bookTx: potentialMatch,
        status: MatchStatus.POTENTIAL,
        confidence: 80,
        note: `ยอดเงินตรงกัน แต่วันที่ต่างกัน (${bankTx.date} vs ${potentialMatch.date})`
      });
      usedBankIds.add(bankTx.id);
      usedBookIds.add(potentialMatch.id);
    }
  });
  
  // 3. Amount Error Match (Same Date, Similar Description, Slight Amount Diff or Swapped Digits)
  // This is a simplified version. Real world would verify description similarity more deeply.
  bankData.forEach(bankTx => {
    if (usedBankIds.has(bankTx.id)) return;
    
    const similarMatch = bookData.find(bookTx => {
      if (usedBookIds.has(bookTx.id)) return false;
      if (bookTx.date !== bankTx.date) return false;

      // Check if amount is within 1% error (e.g. fee deduction?)
      const ratio = Math.abs(bookTx.amount - bankTx.amount) / Math.abs(bankTx.amount);
      return ratio < 0.05; // 5% tolerance
    });

    if (similarMatch) {
       results.push({
        id: `match-${bankTx.id}-${similarMatch.id}`,
        bankTx,
        bookTx: similarMatch,
        status: MatchStatus.POTENTIAL,
        confidence: 60,
        note: `วันที่ตรงกัน ยอดเงินต่างกันเล็กน้อย (${bankTx.amount} vs ${similarMatch.amount})`
      });
      usedBankIds.add(bankTx.id);
      usedBookIds.add(similarMatch.id);
    }
  });

  // 4. Collect Unmatched Bank
  bankData.forEach(bankTx => {
    if (!usedBankIds.has(bankTx.id)) {
      results.push({
        id: `unmatched-bank-${bankTx.id}`,
        bankTx,
        status: MatchStatus.UNMATCHED,
        confidence: 0,
        note: 'ไม่พบรายการคู่ขาใน Book'
      });
    }
  });

  // 5. Collect Unmatched Book
  bookData.forEach(bookTx => {
    if (!usedBookIds.has(bookTx.id)) {
      results.push({
        id: `unmatched-book-${bookTx.id}`,
        bookTx,
        status: MatchStatus.UNMATCHED,
        confidence: 0,
        note: 'ไม่พบรายการคู่ขาใน Bank (อาจบันทึกเกิน หรือเช็คยังไม่ขึ้นเงิน)'
      });
    }
  });

  const summary: ReconciliationSummary = {
    totalBank: bankData.length,
    totalBook: bookData.length,
    matchedCount: results.filter(r => r.status === MatchStatus.MATCHED).length,
    potentialCount: results.filter(r => r.status === MatchStatus.POTENTIAL).length,
    unmatchedBankCount: results.filter(r => r.status === MatchStatus.UNMATCHED && r.bankTx).length,
    unmatchedBookCount: results.filter(r => r.status === MatchStatus.UNMATCHED && r.bookTx).length,
  };

  return { results, summary };
};
