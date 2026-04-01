/**
 * Active/focus styling aligned with subscriptions toolbar search
 * (Primary/300 border + xs shadow + 4px Primary/100 spread).
 */
export const figmaFieldFocusTransition =
  "transition-[border-color,box-shadow] duration-150";

export const figmaFieldFocusVisible = [
  figmaFieldFocusTransition,
  "outline-none focus-visible:border-[#84adff] focus-visible:shadow-[0_1px_2px_rgba(16,24,40,0.05),0_0_0_4px_#d1e0ff]",
].join(" ");

export const figmaFieldFocusWithin = [
  figmaFieldFocusTransition,
  "focus-within:border-[#84adff] focus-within:shadow-[0_1px_2px_rgba(16,24,40,0.05),0_0_0_4px_#d1e0ff]",
].join(" ");

/** Use on inner inputs inside a composite field so focus is expressed on the wrapper only. */
export const figmaFieldInnerInput =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-0";
