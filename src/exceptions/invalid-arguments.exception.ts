export class InvalidArgumentsException extends Error {
  constructor(message?: string) {
    super(message || 'There are invalid arguments');
  }
}
