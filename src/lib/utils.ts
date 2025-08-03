import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toPlainObject = <T>(doc: unknown): T =>
  JSON.parse(JSON.stringify(doc));

export const trimTitle = (title: string) =>
  title
    .replace(/^\s+/, "") // Trim Leading spaces
    .replace(/\s{2,}/g, " ") // Replace multiple spaces with one
    .trim(); // Trim trailing spaces
