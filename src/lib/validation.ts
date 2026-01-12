import { z } from 'zod';

/**
 * Validates that a URL uses a safe protocol (http/https only)
 * Prevents javascript:, data:, and other potentially dangerous URLs
 */
export const safeUrlSchema = z.string()
  .refine((url) => {
    if (!url || url.trim() === '') return true; // Optional field
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, { message: "Please enter a valid URL starting with http:// or https://" });

/**
 * Schema for shop creation and editing
 */
export const shopSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Shop name must be at least 2 characters" })
    .max(100, { message: "Shop name must be less than 100 characters" }),
  category: z.string()
    .max(50, { message: "Category must be less than 50 characters" })
    .optional()
    .or(z.literal('')),
  externalLink: z.string()
    .max(500, { message: "URL must be less than 500 characters" })
    .refine((url) => {
      if (!url || url.trim() === '') return true;
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, { message: "Please enter a valid URL starting with http:// or https://" })
    .optional()
    .or(z.literal('')),
  branchJustification: z.string()
    .max(500, { message: "Branch justification must be less than 500 characters" })
    .optional()
    .or(z.literal('')),
});

/**
 * Schema for shop showcase items
 */
export const shopItemSchema = z.object({
  title: z.string()
    .trim()
    .min(1, { message: "Product name is required" })
    .max(100, { message: "Product name must be less than 100 characters" }),
  description: z.string()
    .max(500, { message: "Description must be less than 500 characters" })
    .optional()
    .or(z.literal('')),
  price: z.number()
    .min(0, { message: "Price cannot be negative" })
    .max(999999.99, { message: "Price must be less than $1,000,000" })
    .optional()
    .nullable(),
});

/**
 * Validates shop form data and returns errors if any
 */
export function validateShopData(data: {
  name: string;
  category?: string;
  externalLink?: string;
  branchJustification?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const result = shopSchema.safeParse(data);
  
  if (result.success) {
    return { valid: true, errors: {} };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path[0] as string;
    errors[path] = err.message;
  });
  
  return { valid: false, errors };
}

/**
 * Validates shop item data and returns errors if any
 */
export function validateShopItemData(data: {
  title: string;
  description?: string;
  price?: number | null;
}): { valid: boolean; errors: Record<string, string> } {
  const result = shopItemSchema.safeParse(data);
  
  if (result.success) {
    return { valid: true, errors: {} };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path[0] as string;
    errors[path] = err.message;
  });
  
  return { valid: false, errors };
}

/**
 * Check if URL is safe (http/https protocol only)
 */
export function isSafeUrl(url: string): boolean {
  if (!url || url.trim() === '') return true;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
