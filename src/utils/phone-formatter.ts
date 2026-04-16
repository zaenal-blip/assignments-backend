/**
 * Normalizes phone numbers to international format without the '+' prefix.
 * Standard: 628123456789
 * 
 * - Removes non-numeric characters
 * - Converts 08... to 628...
 * - Converts +62... to 62...
 */
export const normalizePhone = (phone: string): string => {
  // 1. Remove non-numeric characters (e.g., +, -, spaces)
  let cleaned = phone.replace(/\D/g, '');

  // 2. Handle 08... -> 628...
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }

  // 3. Ensure it starts with 62 (for Indonesia) if it's too short otherwise
  // Note: This is an assumption based on 62 being the standard for this app.
  if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
};
