// lib/utils/content-filters.ts
export function filterPublicContent<T extends { 
  draft?: boolean; 
  published?: boolean; 
  status?: string;
}>(items: T[]): T[] {
  return items.filter(item => {
    const isDraft = item.draft === true;
    const isNotPublished = item.published === false;
    const isStatusDraft = item.status === 'draft';
    const isStatusArchived = item.status === 'archived';
    const isStatusPrivate = item.status === 'private';
    const isStatusScheduled = item.status === 'scheduled';
    
    return !(isDraft || isNotPublished || isStatusDraft || 
             isStatusArchived || isStatusPrivate || isStatusScheduled);
  });
}


