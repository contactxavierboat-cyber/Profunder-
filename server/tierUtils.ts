export type SubscriptionTier = "basic" | "repair" | "capital";

export function detectTierFromProductName(name: string): SubscriptionTier {
  const lower = name.toLowerCase();
  if (lower.includes("capital")) return "capital";
  if (lower.includes("repair")) return "repair";
  return "basic";
}
