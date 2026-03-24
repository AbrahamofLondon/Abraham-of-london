import { NextRequest, NextResponse } from "next/server";
import { createOrganisationSchema } from "@/lib/alignment/enterprise-schemas";
import { createOrganisation } from "@/lib/alignment/enterprise-repository";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the incoming request body against the Zod schema
    const parsed = createOrganisationSchema.parse(body);
    
    // Persistence layer call to create the record
    const organisation = await createOrganisation(parsed);
    
    return NextResponse.json({ ok: true, organisation });
  } catch (error) {
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Invalid request" 
      },
      { status: 400 }
    );
  }
}