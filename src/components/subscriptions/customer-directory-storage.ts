import type { CustomerDemoProfile } from "@/components/subscriptions/customer-demo-data";

const STORAGE_KEY = "uixhub:subscription-customer-directory";

function asStr(v: unknown): string {
  return typeof v === "string" ? v : v != null ? String(v) : "";
}

/** Lenient parse so one bad field does not discard the whole directory. */
function normalizeCustomerRow(v: unknown): CustomerDemoProfile | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const id = asStr(o.id);
  const name = asStr(o.name);
  const email = asStr(o.email);
  if (!id || !name.trim() || !email.trim()) return null;
  const avatarBg = o.avatarBg;
  return {
    id,
    name,
    email,
    ...(typeof avatarBg === "string" && avatarBg ? { avatarBg } : {}),
    phone: asStr(o.phone),
    address: asStr(o.address),
    country: asStr(o.country),
    state: asStr(o.state),
    city: asStr(o.city),
    zip: asStr(o.zip),
  };
}

export function loadCustomerDirectoryFromStorage(): CustomerDemoProfile[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const rows = parsed
      .map(normalizeCustomerRow)
      .filter((r): r is CustomerDemoProfile => r != null);
    return rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

export function saveCustomerDirectoryToStorage(
  customers: CustomerDemoProfile[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch {
    // quota / private mode
  }
}
