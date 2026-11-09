export interface NavItem {
  label: string
  href: string
}

/** Primary navigation, in display order. Home is reached via the wordmark. */
export const primaryNav: readonly NavItem[] = [
  { label: "Services", href: "/services/" },
  { label: "Packages", href: "/packages/" },
  { label: "About", href: "/about/" },
  { label: "Contact", href: "/contact/" },
]

/** Returns true when `pathname` is `href` or one of its sub-pages. */
export function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href)
}
