/* lib/alignment/enterprise-logic.ts — HARDENED OGR SCORING ENGINE */

export type AlignmentBand = "Emergent" | "Aligned" | "Sovereign";

export interface ScoreResult {
  percentScore: number;
  band: AlignmentBand;
  frictionPoints: number;
  totalScore: number;
  possibleScore: number;
}

/**
 * Calculates the OGR score with 0-error defensive logic.
 * Enforces strict boundaries and handles malformed input data.
 */
export function calculateEnterpriseAssessment(
  answers: Record<string, any>, 
  maxWeightPerQuestion: number = 5
): ScoreResult {
  const entries = Object.entries(answers);
  const totalQuestions = entries.length;

  // 1. Defend against empty datasets
  if (totalQuestions === 0) {
    return { 
      percentScore: 0, 
      band: "Emergent", 
      frictionPoints: 100,
      totalScore: 0,
      possibleScore: 0 
    };
  }

  // 2. Defensive calculation using strict type conversion
  const totalScore = entries.reduce((acc, [_, value]) => {
    let numericVal = 0;
    
    if (typeof value === 'number') {
      numericVal = isNaN(value) ? 0 : value;
    } else if (typeof value === 'boolean') {
      numericVal = value ? maxWeightPerQuestion : 0;
    } else if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      numericVal = isNaN(parsed) ? 0 : parsed;
    }

    // Clamp individual answer to ensure it doesn't exceed weight limits
    return acc + Math.max(0, Math.min(numericVal, maxWeightPerQuestion));
  }, 0);

  const possibleScore = totalQuestions * maxWeightPerQuestion;
  
  // 3. Prevent Division by Zero and NaN
  const rawPercent = possibleScore > 0 ? (totalScore / possibleScore) * 100 : 0;
  const percentScore = Math.round(Math.max(0, Math.min(rawPercent, 100)));

  // 4. Band Assignment (Strict Boundary checks)
  let band: AlignmentBand = "Emergent";
  if (percentScore >= 80) band = "Sovereign";
  else if (percentScore >= 50) band = "Aligned";

  return {
    percentScore,
    band,
    frictionPoints: 100 - percentScore,
    totalScore,
    possibleScore
  };
}