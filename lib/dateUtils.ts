export function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) {
    return new Date().toISOString();
  }

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date provided: ${dateInput}, using current date`);
      return new Date().toISOString();
    }
    
    return date.toISOString();
  } catch {
    console.warn(`Error parsing date: ${dateInput}, using current date`);
    return new Date().toISOString();
  }
}

export function parseDate(dateInput: string | Date | undefined): Date {
  if (!dateInput) {
    return new Date();
  }

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date provided: ${dateInput}, using current date`);
      return new Date();
    }
    
    return date;
  } catch {
    console.warn(`Error parsing date: ${dateInput}, using current date`);
    return new Date();
  }
}