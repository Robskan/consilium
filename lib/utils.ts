import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function arraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false;

  const aSorted = [...a].sort((x, y) => x - y);
  const bSorted = [...b].sort((x, y) => x - y);

  return aSorted.every((value, index) => value === bSorted[index]);
}