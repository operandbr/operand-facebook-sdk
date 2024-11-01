export class OperandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperandError";
  }
}
