import { HubToastProvider, HubToastViewport } from "@/components/payment-hub/hub-toast";
import { Sidebar } from "@/components/payment-hub/Sidebar";
import { Topbar } from "@/components/payment-hub/Topbar";

/**
 * Payment Hub shell: left nav + top bar + scrollable main column.
 * Hub routes wrap only `children` in the main column; sidebar/topbar stay consistent.
 */
export function PaymentHubShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HubToastProvider>
      {/* overflow-x visible so sidebar collapse control can straddle the rail; main column keeps overflow */}
      <div className="flex h-full min-h-0 bg-slate-100/70 text-foreground">
        <Sidebar />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50">
          <Topbar />

          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#ECEEF2] p-0">
            <HubToastViewport />
            {children}
          </main>
        </div>
      </div>
    </HubToastProvider>
  );
}
