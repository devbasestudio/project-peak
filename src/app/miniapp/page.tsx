"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { formatMmk, projectPrograms } from "@/lib/projectPeakConfig";

export default function MiniAppPage() {
  return (
    <main className="pp-shell">
      <section className="pp-miniapp pp-miniapp-flow">
        <motion.header
          className="pp-miniapp-flow__hero"
        >
          <Image src="/img/hero_bg.jpg" alt="Project Peak mountain training" fill priority sizes="(max-width: 780px) 100vw, 780px" />
          <div />
          <article>
            <p>Welcome · Project Peak Mini App</p>
            <h1>Choose your package</h1>
            <span>Package တစ်ခုရွေးပြီး detail page မှာဘာတွေပါလဲကြည့်ပါ။ ပြီးမှ duration ရွေးပြီး payment submit လုပ်ပါ။</span>
          </article>
        </motion.header>

        <div className="pp-flow-steps" aria-label="Purchase steps">
          {["Package", "Details", "Payment"].map((step, index) => (
            <motion.span
              key={step}
              className={index === 0 ? "is-active" : ""}
            >
              {index + 1}. {step}
            </motion.span>
          ))}
        </div>

        <div className="pp-package-grid">
          {projectPrograms.map((program) => (
            <motion.article
              key={program.key}
              className="pp-package-card"
              style={{ "--package-accent": program.accent } as CSSProperties}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.985 }}
            >
              <Link href={`/miniapp/packages/${program.key}`} aria-label={`View ${program.name}`}>
                <div className="pp-package-card__media">
                  <Image src={program.image} alt={program.name} fill sizes="(max-width: 780px) calc(100vw - 40px), 340px" />
                  <span>{program.shortName}</span>
                </div>
                <div className="pp-package-card__body">
                  <p>{program.bestFor}</p>
                  <h2>{program.name}</h2>
                  <span>{program.headline}</span>
                  <div>
                    <strong>{formatMmk(program.durations[0].price)}</strong>
                    <em>starts from</em>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  );
}
