"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Logo } from "@/components/Logo";

// Only the unwatermarked shots. Each one drifts on its own path (alternating zoom out / zoom in) so consecutive slides never repeat a move.
// Scale stays >= 1.08 so a pan of up to 3% never exposes an edge.
const SLIDES = [
  { src: "/showcase/1.jpg", room: "Double-height living", place: "Avlon Park", from: { scale: 1.2, x: "-3%", y: "2%" }, to: { scale: 1.08, x: "1%", y: "0%" } },
  { src: "/showcase/4.jpg", room: "Walk-in wardrobe", place: "Avlon Park", from: { scale: 1.08, x: "2%", y: "0%" }, to: { scale: 1.2, x: "-2%", y: "-1%" } },
  { src: "/showcase/6.jpg", room: "Modular kitchen", place: "The Prestige City", from: { scale: 1.18, x: "0%", y: "3%" }, to: { scale: 1.08, x: "-1%", y: "-1%" } },
];
const DURATION = 7000;
const FADE = 2.2;
const SOFT = [0.22, 1, 0.36, 1] as const;

function useSlides() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setI((n) => (n + 1) % SLIDES.length), DURATION);
    return () => clearTimeout(t);
  }, [i]);
  return { i, setI, slide: SLIDES[i] };
}

/**
 * One slide. The incoming photo fades in on top while the outgoing one stays fully opaque underneath
 * (no dark dip mid-crossfade), and its slow drift runs through both fades so the frame never stops moving.
 */
function Slide({ slide, sizes, first }: { slide: (typeof SLIDES)[number]; sizes: string; first: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, zIndex: 1 }}
      animate={{ opacity: 1, zIndex: 1 }}
      exit={{ opacity: 0, zIndex: 0, transition: { opacity: { delay: FADE, duration: 0 } } }}
      transition={{ opacity: { duration: FADE, ease: [0.45, 0, 0.55, 1] } }}
    >
      <motion.div
        className="absolute inset-0 will-change-transform"
        initial={slide.from}
        animate={slide.to}
        transition={{ duration: DURATION / 1000 + FADE * 2, ease: [0.33, 0, 0.67, 1] }}
      >
        <Image src={slide.src} alt="" fill priority={first} sizes={sizes} className="object-cover" />
      </motion.div>
    </motion.div>
  );
}

/** Loads every slide up front so a fade never reveals a half-loaded photo. */
function Preload({ sizes }: { sizes: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0">
      {SLIDES.map((s) => (
        <Image key={s.src} src={s.src} alt="" fill loading="eager" sizes={sizes} />
      ))}
    </div>
  );
}

/** The sign-in page's photo panel: an auto-advancing slideshow of delivered homes. */
export function Showcase() {
  const { i, setI, slide } = useSlides();
  const sizes = "55vw";

  return (
    <MotionConfig reducedMotion="user">
      <aside
        className="relative hidden overflow-hidden bg-espresso lg:block"
        aria-label="Homes by Home Karigar"
      >
        <Preload sizes={sizes} />
        <AnimatePresence initial={false}>
          <Slide key={slide.src} slide={slide} sizes={sizes} first={i === 0} />
        </AnimatePresence>
        <div aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-t from-black/80 via-black/15 to-black/40" />

        <div className="relative z-[3] flex h-full flex-col justify-between p-12 xl:p-16">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: SOFT }}>
            <Logo tone="light" />
          </motion.div>

          <div>
            <h2 className="display max-w-xl text-[clamp(2.75rem,4.2vw,4.75rem)] font-light text-white">
              {"Every home,".split(" ").map((w, n) => (
                <motion.span
                  key={w}
                  className="mr-[0.25em] inline-block"
                  initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 1.1, delay: 0.25 + n * 0.12, ease: SOFT }}
                >
                  {w}
                </motion.span>
              ))}
              <motion.span
                className="accent block text-brass"
                initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.1, delay: 0.55, ease: SOFT }}
              >
                exactly as delivered.
              </motion.span>
            </h2>

            <div className="mt-12 flex items-end justify-between gap-8">
              <div className="flex h-12 items-start gap-4 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={i}
                    className="eyebrow pt-[3px] text-brass tabular-nums"
                    initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, delay: 0.5, ease: SOFT } }}
                    exit={{ opacity: 0, y: -6, filter: "blur(6px)", transition: { duration: 0.45, ease: "easeIn" } }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </motion.span>
                </AnimatePresence>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={slide.room}
                    initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, delay: 0.62, ease: SOFT } }}
                    exit={{ opacity: 0, y: -6, filter: "blur(6px)", transition: { duration: 0.45, ease: "easeIn" } }}
                  >
                    <p className="text-[0.9375rem] font-medium text-white">{slide.room}</p>
                    <p className="eyebrow mt-2 text-white/60">{slide.place}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex gap-2" role="tablist" aria-label="Choose photo">
                {SLIDES.map((s, n) => (
                  <button
                    key={s.src}
                    role="tab"
                    aria-selected={n === i}
                    aria-label={s.room}
                    onClick={() => setI(n)}
                    className="relative h-[3px] w-9 overflow-hidden rounded-full bg-white/25 transition-[width] duration-500 hover:bg-white/40 aria-selected:w-14"
                  >
                    {n === i && (
                      <motion.span
                        key={i}
                        className="absolute inset-y-0 left-0 bg-white"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: DURATION / 1000, ease: "linear" }}
                      />
                    )}
                    {n < i && <span className="absolute inset-0 bg-white/70" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </MotionConfig>
  );
}

/** Phones and tablets: the same slideshow as a rounded banner above the form. */
export function ShowcaseBanner() {
  const { i, slide } = useSlides();
  const sizes = "(min-width: 640px) 90vw, 100vw";

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: SOFT }}
        className="relative mt-6 aspect-[16/11] overflow-hidden rounded-3xl bg-espresso shadow-lift sm:aspect-[16/8] lg:hidden"
      >
        <Preload sizes={sizes} />
        <AnimatePresence initial={false}>
          <Slide key={slide.src} slide={slide} sizes={sizes} first={i === 0} />
        </AnimatePresence>
        <div aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-x-5 bottom-5 z-[3] flex items-end justify-between gap-4 sm:inset-x-7 sm:bottom-6">
          <p className="display text-[1.7rem] font-light text-white sm:text-4xl">
            Every home, <span className="accent block text-brass">exactly as delivered.</span>
          </p>
          <div className="mb-1.5 flex shrink-0 gap-1.5">
            {SLIDES.map((s, n) => (
              <span key={s.src} className={`h-[3px] rounded-full transition-all duration-500 ${n === i ? "w-6 bg-white" : "w-2.5 bg-white/40"}`} />
            ))}
          </div>
        </div>
      </motion.div>
    </MotionConfig>
  );
}
