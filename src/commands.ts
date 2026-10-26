import { type QuoteKind } from "./core/model.ts";

export const COMMANDS = {
  cycle: "quoteSwitcher.cycleQuotes",
  single: "quoteSwitcher.convertToSingle",
  double: "quoteSwitcher.convertToDouble",
  template: "quoteSwitcher.convertToTemplate",
} as const;

export type QuoteCommand =
  | { readonly kind: "cycle" }
  | { readonly kind: "convert"; readonly target: QuoteKind };

export const COMMAND_ACTIONS: Readonly<Record<(typeof COMMANDS)[keyof typeof COMMANDS], QuoteCommand>> = {
  [COMMANDS.cycle]: { kind: "cycle" },
  [COMMANDS.single]: { kind: "convert", target: "single" },
  [COMMANDS.double]: { kind: "convert", target: "double" },
  [COMMANDS.template]: { kind: "convert", target: "template" },
};
