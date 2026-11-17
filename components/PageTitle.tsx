import { ReactNode } from "react";

/** Magazine-style section opener: tracked kicker, oversized title, heavy rule. */
export default function PageTitle({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 border-b-4 border-line pb-5 pt-10">
      <p className="kicker mb-3 flex items-center gap-3">
        <span className="inline-block h-3 w-10 bg-accent" />
        {kicker}
      </p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(3rem,9vw,6.5rem)]">{title}</h1>
          {subtitle && <p className="mt-3 max-w-xl text-base font-medium">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
