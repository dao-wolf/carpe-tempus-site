/** A short, human-readable name for an external URL, e.g. "daowolf.com" or "LinkedIn". */
export function linkLabel(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, "")
  return host === "linkedin.com" || host.endsWith(".linkedin.com")
    ? "LinkedIn"
    : host
}
