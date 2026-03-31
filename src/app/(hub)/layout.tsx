import { PaymentHubShell } from "@/components/payment-hub/payment-hub-shell";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PaymentHubShell>{children}</PaymentHubShell>;
}
