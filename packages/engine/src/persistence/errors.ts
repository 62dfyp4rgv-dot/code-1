/** Raised when stored or imported save data is damaged, hostile or structurally invalid. */
export class SaveCorruptedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaveCorruptedError';
  }
}
