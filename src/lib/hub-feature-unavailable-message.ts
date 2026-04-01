/**
 * Stub / not-built-yet flows — same structure as “Import as CSV” (error toast).
 */
export function hubFeatureUnavailableMessage(featureLabel: string) {
  const trimmed = featureLabel.trim();
  return `${trimmed} isn't available yet. This flow is still in progress. Please try again in two to three days.`;
}
