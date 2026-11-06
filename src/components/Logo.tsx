import Image from "next/image";
import { cn } from "@/lib/utils";

const TAGLINE = "Design. Detail. Distinction.";

/**
 * The Home Karigar lockup, copied from the website (src/components/ui/Logo.tsx): the two textured stones
 * layered on one canvas beside "HOME KARIGAR" in Cormorant Garamond. Umber on light; ivory and brass on dark.
 */
/** `markOnlyOnMobile` shows just the stone mark on phones, as the website header does. */
export function Logo({ tone = "dark", className, markOnlyOnMobile }: { tone?: "dark" | "light"; className?: string; markOnlyOnMobile?: boolean }) {
  // Pre-sized transparent webp, served as-is: the optimiser would flatten the alpha.
  const shared = { fill: true, unoptimized: true, loading: "eager", draggable: false } as const;
  return (
    <span className={cn("group/logo inline-flex items-center gap-3", className)}>
      <span aria-hidden className="relative block aspect-[700/858] h-10 shrink-0 drop-shadow-[0_1px_1.5px_rgb(51_32_13/0.22)] md:h-11">
        <Image src="/brand/sm/stone-tall.webp" alt="" {...shared} className="origin-bottom-left select-none transition-transform duration-700 ease-[var(--ease-premium)] group-hover/logo:-translate-y-[3%] group-hover/logo:-rotate-3" />
        <Image src="/brand/sm/stone-small.webp" alt="" {...shared} className="origin-bottom select-none transition-transform duration-700 ease-[var(--ease-premium)] group-hover/logo:translate-x-[4%] group-hover/logo:rotate-6" />
      </span>
      <span className={cn("flex flex-col leading-none", tone === "light" ? "text-white" : "text-umber", markOnlyOnMobile && "max-sm:hidden")}>
        <span className="whitespace-nowrap font-accent text-[1.05rem] font-bold uppercase tracking-[0.28em] md:text-[1.15rem]">Home Karigar</span>
        <span className={cn("mt-1.5 whitespace-nowrap font-sans text-[0.5625rem] tracking-[0.2em] md:text-[0.625rem]", tone === "light" ? "text-brass" : "text-taupe")}>
          {TAGLINE}
        </span>
      </span>
    </span>
  );
}
