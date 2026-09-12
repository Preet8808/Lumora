import { URL } from "url";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "::",
  "local",
]);

export function isSafeUrl(urlString: string): { safe: boolean; reason?: string; url?: URL } {
  try {
    const parsed = new URL(urlString);

    // Only allow http and https protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { safe: false, reason: "Only HTTP and HTTPS protocols are supported" };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check against direct blocked hostnames
    if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
      return { safe: false, reason: "Internal and loopback addresses are blocked" };
    }

    // Check IPv4 private and link-local ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);

      // 127.0.0.0/8 (Loopback)
      if (octet1 === 127) return { safe: false, reason: "Loopback IP addresses are blocked" };
      // 10.0.0.0/8 (Private network)
      if (octet1 === 10) return { safe: false, reason: "Private IP addresses are blocked" };
      // 172.16.0.0/12 (Private network)
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) {
        return { safe: false, reason: "Private IP addresses are blocked" };
      }
      // 192.168.0.0/16 (Private network)
      if (octet1 === 192 && octet2 === 168) {
        return { safe: false, reason: "Private IP addresses are blocked" };
      }
      // 169.254.0.0/16 (Link-local / AWS metadata 169.254.169.254)
      if (octet1 === 169 && octet2 === 254) {
        return { safe: false, reason: "Link-local cloud metadata addresses are blocked" };
      }
      // 0.0.0.0/8
      if (octet1 === 0) return { safe: false, reason: "Invalid target IP address" };
    }

    return { safe: true, url: parsed };
  } catch {
    return { safe: false, reason: "Malformed URL" };
  }
}
