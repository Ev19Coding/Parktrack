/**
 * Rounds a number to a specified number of decimal places
 * @param number - The number to round
 * @param decimalPlaces - Number of decimal places (default: 0)
 * @returns The rounded number
 */
export function approximateNumberToDecimalPlaces(
	number: number,
	decimalPlaces = 0,
) {
	if (decimalPlaces < 0) decimalPlaces = 0;
	const mod = 10 ** decimalPlaces;
	return Math.round(number * mod) / mod;
}

/**
 * Formats a date as a full date string with time
 * @param date - The date to format
 * @returns Formatted date string (e.g., "January 15, 2024 at 02:30 PM")
 */
export function formatDateFull(date: Date): string {
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Formats a date as a relative time string
 * @param date - The date to format relative to now
 * @returns Relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function formatDateRelative(date: Date): string {
	const now = new Date();
	const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
	const absDiff = Math.abs(diffInSeconds);
	const isPast = diffInSeconds < 0;
	const suffix = isPast ? " ago" : " from now";

	if (absDiff < 60) {
		return isPast ? "just now" : "in a moment";
	}

	const diffInMinutes = Math.floor(absDiff / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"}${suffix}`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours} hour${diffInHours === 1 ? "" : "s"}${suffix}`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 7) {
		return `${diffInDays} day${diffInDays === 1 ? "" : "s"}${suffix}`;
	}

	const diffInWeeks = Math.floor(diffInDays / 7);
	if (diffInWeeks < 4) {
		return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"}${suffix}`;
	}

	const diffInMonths = Math.floor(diffInDays / 30);
	if (diffInMonths < 12) {
		return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"}${suffix}`;
	}

	const diffInYears = Math.floor(diffInDays / 365);
	return `${diffInYears} year${diffInYears === 1 ? "" : "s"}${suffix}`;
}

/**
 * Formats a date as a time string in 12-hour format
 * @param date - The date to format
 * @returns Time string (e.g., "2:30 PM")
 */
export function formatTime(date: Date): string {
	return date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}
