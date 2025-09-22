// Utility functions for generating and managing short game codes

/**
 * Generates a random 6-character alphanumeric code for easy game joining
 * Uses only uppercase letters and numbers, excluding similar characters (0, O, I, 1)
 */
export function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Validates if a game code has the correct format
 */
export function isValidGameCode(code: string): boolean {
  const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
  return validChars.test(code);
}