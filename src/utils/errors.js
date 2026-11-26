/** An expected, user-facing error (bad input, wrong password, not found, ...). */
class AppError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Thrown when the user types the "back" key (0) at a prompt.
 * The menu loop catches it and shows the current menu again.
 */
class GoBack extends Error {
  constructor() {
    super('Going back');
    this.name = 'GoBack';
  }
}

module.exports = { AppError, GoBack };
