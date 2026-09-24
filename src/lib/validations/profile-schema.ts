import { z } from "zod";

/**
 * Parent profile edits (bead hustle-4dc.10). Email is deliberately not editable
 * here: changing it requires re-verification, which is its own flow.
 */
export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  phone: z
    .string()
    .trim()
    .max(32)
    .regex(/^[0-9+().\-\s]*$/, "Phone can only contain digits and + ( ) - .")
    .optional()
    .or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
