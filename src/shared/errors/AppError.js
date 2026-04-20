export class AppError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'AppError';
    this.context = context;
  }
}
