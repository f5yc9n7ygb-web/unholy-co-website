import type { Route } from "next"
import Link from "next/link"
import { ReactNode } from "react"

type HeroAction = {
  label: string
  href: string
  variant?: "primary" | "ghost"
}

type MicroHeroProps = {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: HeroAction[]
}

/**
 * A compact "hero" section component for page headers.
 * It displays an optional eyebrow, a title, a description, and a set of action buttons.
 *
 * @param {MicroHeroProps} props - The props for the component.
 * @param {string} [props.eyebrow] - An optional text displayed above the title, often in uppercase.
 * @param {string} props.title - The main title of the hero section.
 * @param {ReactNode} [props.description] - The description text or JSX content.
 * @param {HeroAction[]} [props.actions] - An array of action objects to be rendered as buttons.
 * @returns {JSX.Element} The rendered micro-hero section.
 */
export function MicroHero({ eyebrow, title, description, actions }: MicroHeroProps) {
  return (
    <section className="micro-hero">
      <div className="micro-hero-content space-y-4">
        {eyebrow ? (
          <span className="badge border-blood/40 bg-blood/10 text-bone/80 uppercase tracking-[0.35em]">
            {eyebrow}
          </span>
        ) : null}

        <h1 className="h1 leading-tight">{title}</h1>

        {description ? (
          <div className="p max-w-3xl">
            {typeof description === "string" ? <p>{description}</p> : description}
          </div>
        ) : null}

        {actions?.length ? (
          <div className="flex flex-wrap gap-3 pt-2">
            {actions.map((action) => {
              const className =
                action.variant === "ghost"
                  ? "btn btn-ghost"
                  : "btn btn-primary"
              const isInternal = action.href.startsWith("/")
              return (
                isInternal ? (
                  <Link key={action.href} href={action.href as Route} className={className}>
                    {action.label}
                  </Link>
                ) : (
                  <a key={action.href} href={action.href} className={className} target="_blank" rel="noreferrer">
                    {action.label}
                  </a>
                )
              )
            })}
          </div>
        ) : null}
      </div>
    </section>
  )
}
