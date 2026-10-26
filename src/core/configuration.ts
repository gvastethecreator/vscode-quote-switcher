import { type QuoteKind } from "./model.ts";

export const DEFAULT_QUOTE_ORDER: readonly QuoteKind[] = ["single", "double", "template"];
const VALID = new Set<QuoteKind>(DEFAULT_QUOTE_ORDER);
const MAX_CONFIG_ITEMS = 12;

export function normalizeQuoteOrder(value: unknown): readonly QuoteKind[] {
  if (!Array.isArray(value) || value.length > MAX_CONFIG_ITEMS) return DEFAULT_QUOTE_ORDER;
  const normalized: QuoteKind[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !VALID.has(item as QuoteKind)) continue;
    const quote = item as QuoteKind;
    if (!normalized.includes(quote)) normalized.push(quote);
  }
  return normalized.length > 0 ? normalized : DEFAULT_QUOTE_ORDER;
}
