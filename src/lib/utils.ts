import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${Math.floor(diffInDays / 365)}y ago`;
}

export function formatDuration(durationSecondsOrMinutes: number | null, type?: string): string | null {
  if (!durationSecondsOrMinutes || durationSecondsOrMinutes <= 0) return null;
  // If it's over 1000 and type is youtube, it's likely seconds, else minutes
  if (durationSecondsOrMinutes > 120 && type === "youtube") {
    const minutes = Math.floor(durationSecondsOrMinutes / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${minutes} min`;
  }

  if (durationSecondsOrMinutes >= 60) {
    const hours = Math.floor(durationSecondsOrMinutes / 60);
    const mins = durationSecondsOrMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  return `${durationSecondsOrMinutes} min`;
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "website";
  }
}
