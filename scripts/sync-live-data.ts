import { PrismaClient } from "@prisma/client";
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function syncLiveData() {
  // 1. Get the latest verified assessment
  const assessment = await prisma.enterpriseAssessment.findFirst({
    orderBy: { submittedAt: 'desc' }
  });

  if (!assessment) return;
  const scores = assessment.answersJson as Record<string, any>;

  // 2. Map the real data to the Briefing 001 file
  const filePath = path.join(process.cwd(), 'content/briefs/brief-001.mdx');
  let content = fs.readFileSync(filePath, 'utf8');

  const realData = scores['brief-001'];

  // 3. Inject the REAL telemetry
  content = content.replace(/label="Resonance" value=".*?"/, `label="Resonance" value="${realData.score}/100"`);
  content = content.replace(/label="Integrity" value=".*?"/, `label="Integrity" value="${realData.status === 'stable' ? 'Verified' : 'At Risk'}"`);

  fs.writeFileSync(filePath, content);
  console.log(">> Telemetry Synced: Brief-001 now reflects Live Database Truth.");
}

syncLiveData();