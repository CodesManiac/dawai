import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names while resolving Tailwind conflicts.
 * Use this in every component that accepts a `className` override.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
