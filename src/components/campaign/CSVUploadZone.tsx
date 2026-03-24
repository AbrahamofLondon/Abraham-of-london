// src/components/campaign/CSVUploadZone.tsx
"use client"

import { useState } from 'react';
import { parseParticipantsCSV, CSVParticipant } from '@/lib/utils/csv-parser';
import { handleCreateCampaign } from '@/app/actions/campaign-actions';
import { toast } from 'sonner';

export function CSVUploadZone({ organisationId }: { organisationId: string }) {
  const [participants, setParticipants] = useState<CSVParticipant[]>([]);
  const [title, setTitle] = useState("");

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await parseParticipantsCSV(file);
        setParticipants(data);
        toast.success(`Loaded ${data.length} participants from CSV`);
      } catch (err) {
        toast.error("Failed to parse CSV. Check your column headers.");
      }
    }
  };

  const onSubmit = async () => {
    if (!title || participants.length === 0) return;

    const result = await handleCreateCampaign({
      organisationId,
      title,
      participants,
      cadenceType: "ad_hoc",
      status: "draft"
    });

    if (result?.success) {
      toast.success("Campaign initialized with CSV data.");
    } else {
      toast.error("Failed to create campaign.");
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg">
      <input 
        type="text" 
        placeholder="Campaign Title (e.g., Q1 Alignment Audit)" 
        className="w-full mb-4 p-2 border rounded"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      
      <input 
        type="file" 
        accept=".csv" 
        onChange={onFileChange}
        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
      />

      {participants.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium">{participants.length} valid entries detected.</p>
          <button 
            onClick={onSubmit}
            className="mt-2 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            Create Intelligence Campaign
          </button>
        </div>
      )}
    </div>
  );
}