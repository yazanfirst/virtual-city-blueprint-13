/**
 * Password security utilities using Have I Been Pwned API
 * Uses k-anonymity model - only first 5 chars of hash sent to API
 */

export interface LeakCheckResult {
  isLeaked: boolean;
  count: number;
}

/**
 * Converts an ArrayBuffer to a hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Hashes a password using SHA-1 (required by HIBP API)
 */
async function sha1Hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return bufferToHex(hashBuffer);
}

/**
 * Checks if a password has been leaked using the HIBP Pwned Passwords API
 * Uses k-anonymity: only sends first 5 chars of SHA-1 hash
 * 
 * @param password - The password to check
 * @returns Object with isLeaked boolean and count of times seen in breaches
 */
export async function checkPasswordLeaked(password: string): Promise<LeakCheckResult> {
  try {
    const hash = await sha1Hash(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Adds padding to prevent response length analysis
      },
    });

    if (!response.ok) {
      console.error('HIBP API error:', response.status);
      // Fail open - don't block registration if API is down
      return { isLeaked: false, count: 0 };
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix.trim().toUpperCase() === suffix) {
        const count = parseInt(countStr.trim(), 10);
        return { isLeaked: true, count };
      }
    }

    return { isLeaked: false, count: 0 };
  } catch (error) {
    console.error('Password leak check failed:', error);
    // Fail open - don't block registration if check fails
    return { isLeaked: false, count: 0 };
  }
}

/**
 * Password strength requirements
 */
export const passwordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

/**
 * Checks password strength and returns unmet requirements
 */
export function checkPasswordStrength(password: string): {
  isStrong: boolean;
  unmetRequirements: string[];
} {
  const unmetRequirements: string[] = [];

  if (password.length < passwordRequirements.minLength) {
    unmetRequirements.push(`At least ${passwordRequirements.minLength} characters`);
  }
  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    unmetRequirements.push('At least one uppercase letter');
  }
  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    unmetRequirements.push('At least one lowercase letter');
  }
  if (passwordRequirements.requireNumber && !/[0-9]/.test(password)) {
    unmetRequirements.push('At least one number');
  }
  if (passwordRequirements.requireSpecial && !/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) {
    unmetRequirements.push('At least one special character (!@#$%^&*...)');
  }

  return {
    isStrong: unmetRequirements.length === 0,
    unmetRequirements,
  };
}
