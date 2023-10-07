export class BPError extends Error {
  public get sourceError(): unknown {
    if (this.cause instanceof BPError) {
      return this.cause.sourceError;
    }
    return this.cause;
  }
  public constructor(message: string, options: ErrorOptions) {
    super(message, options);
  }
}
