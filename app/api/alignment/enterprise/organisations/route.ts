export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createOrganisationSchema } from "@/lib/alignment/enterprise-schemas";
import { createOrganisation } from "@/lib/alignment/enterprise-repository";

// Helper to generate a slug from the organisation name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the incoming request body against the Zod schema
    const parsed = createOrganisationSchema.parse(body);
    
    // Generate slug if not provided in the schema
    const slug = parsed.slug || generateSlug(parsed.name);
    
    // Persistence layer call to create the record
    // Both status and metadata have defaults in Prisma schema
    const organisation = await createOrganisation({
      name: parsed.name,
      slug: slug,
      sector: parsed.sector ?? null,
      sizeBand: parsed.sizeBand ?? null,
      region: parsed.region ?? null,
    });
    
    return NextResponse.json({ ok: true, organisation }, { status: 201 });
  } catch (error) {
    console.error("[ORGANISATION_CREATE_ERROR]", error);
    
    // Handle duplicate slug error gracefully
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "An organisation with this name or slug already exists" 
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Invalid request" 
      },
      { status: 400 }
    );
  }
}