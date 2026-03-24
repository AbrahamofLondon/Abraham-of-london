import { 
  loadCampaignAssessments, 
  replaceOrganisationSnapshot, 
  replaceTeamSnapshots,
  getCampaignById
} from "./enterprise-repository";
import { 
  EnterpriseAlignmentBand, 
  EnterpriseAlignmentDomain 
} from "./enterprise-types";

export async function generateCampaignSnapshots(campaignId: string) {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const assessments = await loadCampaignAssessments(campaignId);
  if (assessments.length === 0) return { success: false, message: "No data to aggregate" };

  const totalRespondents = assessments.length;
  const invitedCount = campaign.participants.length;
  const completionRate = totalRespondents / invitedCount;

  // 1. Aggregate Global Metrics
  const avgPercentScore = assessments.reduce((acc, curr) => acc + curr.percentScore, 0) / totalRespondents;
  
  // 2. Aggregate Domain Scores
  const domainTotals: Record<string, { total: number; count: number }> = {};
  
  assessments.forEach(asm => {
    const scores = asm.domainScoresJson as any[];
    scores.forEach(ds => {
      if (!domainTotals[ds.domain]) domainTotals[ds.domain] = { total: 0, count: 0 };
      domainTotals[ds.domain].total += ds.percentScore;
      domainTotals[ds.domain].count += 1;
    });
  });

  const domainScores = Object.entries(domainTotals).map(([domain, data]) => ({
    domain: domain as EnterpriseAlignmentDomain,
    percentScore: data.total / data.count
  }));

  // Sort for strengths and weaknesses
  const sortedDomains = [...domainScores].sort((a, b) => b.percentScore - a.percentScore);
  const strongest = sortedDomains.slice(0, 3).map(d => d.domain);
  const weakest = sortedDomains.slice(-3).reverse().map(d => d.domain);

  // 3. Team-Level Aggregation
  const teamsMap: Record<string, any[]> = {};
  assessments.forEach(asm => {
    const team = asm.teamName || "Unassigned";
    if (!teamsMap[team]) teamsMap[team] = [];
    teamsMap[team].push(asm);
  });

  const teamSnapshots = Object.entries(teamsMap).map(([teamName, teamAsms]) => {
    const teamAvg = teamAsms.reduce((acc, curr) => acc + curr.percentScore, 0) / teamAsms.length;
    return {
      organisationId: campaign.organisationId,
      teamName,
      respondentCount: teamAsms.length,
      totalScore: teamAsms.reduce((acc, curr) => acc + curr.totalScore, 0) / teamAsms.length,
      possibleScore: teamAsms[0].possibleScore,
      percentScore: teamAvg,
      band: determineBand(teamAvg),
      weakestDomains: [], // Simplified for this pass
      strongestDomains: [],
      domainScores: [], 
      varianceScores: []
    };
  });

  // 4. Persistence
  await replaceOrganisationSnapshot({
    campaignId,
    organisationId: campaign.organisationId,
    respondentCount: totalRespondents,
    invitedCount,
    completionRate,
    totalScore: avgPercentScore, // Using percent as the base for the summary
    possibleScore: 100,
    percentScore: avgPercentScore,
    band: determineBand(avgPercentScore),
    weakestDomains: weakest,
    strongestDomains: strongest,
    domainScores,
    varianceScores: [], // Calculated in advanced pass
    fragilitySignal: avgPercentScore < 50 ? "HIGH" : avgPercentScore < 75 ? "MEDIUM" : "LOW",
    dissonanceArea: 0 
  });

  await replaceTeamSnapshots(campaignId, teamSnapshots);

  return { success: true };
}

function determineBand(score: number): EnterpriseAlignmentBand {
  if (score >= 85) return "OPTIMISED";
  if (score >= 70) return "ALIGNED";
  if (score >= 50) return "DRIFTING";
  return "FRAGMENTED";
}