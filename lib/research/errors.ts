export class FoundryHonestyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FoundryHonestyError";
  }
}

export class FoundryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FoundryValidationError";
  }
}

export class FoundryNotFoundError extends Error {
  constructor(id: string) {
    super(`ResearchRun not found: ${id}`);
    this.name = "FoundryNotFoundError";
  }
}
