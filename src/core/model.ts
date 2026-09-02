export const SUPPORTED_LANGUAGE_IDS = [
  "javascript",
  "typescript",
  "json",
  "jsonc",
] as const;

export type SupportedLanguageId = (typeof SUPPORTED_LANGUAGE_IDS)[number];
export type JavaScriptLanguageId = Extract<SupportedLanguageId, "javascript" | "typescript">;
export type JsonLanguageId = Extract<SupportedLanguageId, "json" | "jsonc">;
export type QuoteKind = "single" | "double" | "template";

export interface OffsetRange {
  readonly start: number;
  readonly end: number;
}

export interface LocatedLiteral {
  readonly range: OffsetRange;
  readonly languageId: SupportedLanguageId;
  readonly delimiter: QuoteKind;
  readonly kind: "string" | "template";
  readonly rawBody: string;
  readonly terminated: boolean;
  readonly hasInterpolation: boolean;
  readonly tagged: boolean;
  /** Conservative marker for a stand-alone string expression that may be a directive. */
  readonly directiveLike: boolean;
}

export type TransformRejection =
  | "no-literal"
  | "selection-crosses-boundary"
  | "unsupported-language"
  | "unsupported-target"
  | "malformed-literal"
  | "unsafe-escape"
  | "active-interpolation"
  | "tagged-template"
  | "directive-semantics"
  | "overlapping-targets"
  | "no-safe-target"
  | "document-too-large"
  | "document-too-complex"
  | "too-many-selections"
  | "invalid-command-arguments";

export type DecodeResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly reason: Extract<TransformRejection, "malformed-literal" | "unsafe-escape"> };

export type TransformResult =
  | {
      readonly ok: true;
      readonly text: string;
      readonly target: QuoteKind;
      readonly changed: boolean;
    }
  | { readonly ok: false; readonly reason: TransformRejection };

export interface OffsetSelection {
  readonly anchor: number;
  readonly active: number;
}

export interface LiteralTarget {
  readonly literal: LocatedLiteral;
  readonly selectionIndexes: readonly number[];
}

export type TargetCollectionResult =
  | { readonly ok: true; readonly targets: readonly LiteralTarget[] }
  | { readonly ok: false; readonly reason: TransformRejection };

export interface PlannedEdit {
  readonly range: OffsetRange;
  readonly text: string;
  readonly sourceLength: number;
}

export function isSupportedLanguageId(languageId: string): languageId is SupportedLanguageId {
  return (SUPPORTED_LANGUAGE_IDS as readonly string[]).includes(languageId);
}

export function isJavaScriptLanguage(
  languageId: SupportedLanguageId,
): languageId is JavaScriptLanguageId {
  return languageId === "javascript" || languageId === "typescript";
}
