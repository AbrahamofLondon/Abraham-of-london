import Papa from "papaparse";
import { z } from "zod";

// Define what a "Row" in your CSV should look like
const ParticipantCSVRowSchema = z.object({
  email: z.string().email(),
  fullName: z.string().optional(),
  teamName: z.string().optional(),
  roleTitle: z.string().optional(),
});

export type ParticipantCSVRow = z.infer<typeof ParticipantCSVRowSchema>;

export async function parseParticipantCSV(csvString: string): Promise<{
  data: ParticipantCSVRow[];
  errors: string[];
}> {
  return new Promise((resolve) => {
    Papa.parse(csvString, {
      header: true, // Use the first row as keys
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const validatedData: ParticipantCSVRow[] = [];
        const errors: string[] = [];

        results.data.forEach((row: any, index: number) => {
          const result = ParticipantCSVRowSchema.safeParse(row);
          if (result.success) {
            validatedData.push(result.data);
          } else {
            errors.push(`Row ${index + 1}: ${result.error.issues[0].message}`);
          }
        });

        resolve({ data: validatedData, errors });
      },
      error: (error: Error) => {
        resolve({ data: [], errors: [error.message] });
      },
    });
  });
}