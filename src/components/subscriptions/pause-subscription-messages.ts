export type PauseConfirmPayload =
  | { duration: "indefinite" }
  | { duration: "custom"; resumeDate: Date };

export const PAUSE_SUBSCRIPTION_ERROR_MESSAGE =
  "Couldn't pause subscription. Try again later";

export function pauseSubscriptionSuccessMessage(
  payload: PauseConfirmPayload
): string {
  if (payload.duration === "indefinite") {
    return "Subscription paused";
  }
  const formatted = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(payload.resumeDate);
  return `Subscription paused until ${formatted}`;
}

/**
 * Replace with your pause API. Throw on failure so callers can show
 * {@link PAUSE_SUBSCRIPTION_ERROR_MESSAGE}.
 */
export async function pauseSubscriptionRequest(
  payload: PauseConfirmPayload
): Promise<void> {
  void payload;
  await Promise.resolve();
}
