"use client"

import { useAtomValue } from "jotai"
import NextLink from "next/link"

import { openInNewTabAtom } from "@/store/atoms"

type LinkProps = React.ComponentProps<typeof NextLink>

const isExternal = (href: LinkProps["href"]) =>
  typeof href === "string" && /^(https?:)?\/\//i.test(href)

export const Link = ({ href, target, rel, ...props }: LinkProps) => {
  const newTab = useAtomValue(openInNewTabAtom)
  const external = isExternal(href)

  return (
    <NextLink
      href={href}
      target={target ?? (external && newTab ? "_blank" : undefined)}
      rel={rel ?? (external ? "noopener noreferrer" : undefined)}
      {...props}
    />
  )
}
