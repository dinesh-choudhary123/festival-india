export const COUNTRIES = [
  { code: "All Countries", label: "All Countries", flag: "\uD83C\uDF0D" },
  { code: "IN", label: "India", flag: "\uD83C\uDDEE\uD83C\uDDF3" },
  { code: "US", label: "USA", flag: "\uD83C\uDDFA\uD83C\uDDF8" },
  { code: "GB", label: "UK", flag: "\uD83C\uDDEC\uD83C\uDDE7" },
] as const;

export const FESTIVAL_TYPES = ["Festival Day", "Social Day", "Observance"] as const;
export const FESTIVAL_SCOPES = ["Global", "National", "Regional"] as const;
export const FESTIVAL_CATEGORIES = [
  "Religious",
  "Cultural",
  "Environmental",
  "Health",
  "Social",
  "Political",
  "Fun",
] as const;

export const MONTHS = [
  { value: 0, label: "All Months" },
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export const CURRENCIES = [
  { code: "INR", symbol: "\u20B9", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "\u20AC", name: "Euro" },
  { code: "GBP", symbol: "\u00A3", name: "British Pound" },
  { code: "JPY", symbol: "\u00A5", name: "Japanese Yen" },
  { code: "AED", symbol: "AED", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
] as const;

export const DEFAULT_CURRENCY = "INR";

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol || "\u20B9";
}

export function getYearRange(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear + i);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
