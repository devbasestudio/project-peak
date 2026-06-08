"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { formatMmk, type ProjectProgram } from "@/lib/projectPeakConfig";

export default function ProgramDetailClient({ program }: { program: ProjectProgram }) {
  return (
    <main className="pp-shell">
      <section className="pp-miniapp pp-package-detail">
        <motion.div
          className="pp-detail-hero"
          style={{ "--package-accent": program.accent } as CSSProperties}
        >
          <Link href="/miniapp" className="pp-back-link">
            <i className="ph ph-arrow-left" /> Packages
          </Link>
          <div className="pp-detail-hero__media">
            <Image src={program.image} alt={program.name} fill priority sizes="(max-width: 780px) calc(100vw - 40px), 740px" />
          </div>
          <div className="pp-detail-hero__copy">
            <p>{program.shortName}</p>
            <h1>{program.headline}</h1>
            <span>{program.description}</span>
          </div>
        </motion.div>

        <div className="pp-flow-steps">
          {["Package", "Details", "Payment"].map((step, index) => (
            <span key={step} className={index <= 1 ? "is-active" : ""}>{index + 1}. {step}</span>
          ))}
        </div>

        <motion.section
          className="pp-detail-section"
        >
          <p>Best for</p>
          <h2>ဒီ package က ဘယ်သူတွေအတွက်လဲ</h2>
          <span>{program.bestFor}</span>
        </motion.section>

        <section className="pp-includes-grid">
          {program.includes.map((item) => (
            <motion.article
              key={item.title}
            >
              <i className={`ph ${item.icon}`} />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </motion.article>
          ))}
        </section>

        <section className="pp-detail-split">
          <motion.div>
            <p>Expected outcomes</p>
            <h2>သင်ရမယ့်အရာတွေ</h2>
            {program.outcomes.map((outcome) => (
              <span key={outcome}><i className="ph ph-check-circle" /> {outcome}</span>
            ))}
          </motion.div>
          <motion.div>
            <p>How it works</p>
            <h2>လုပ်ငန်းစဉ်</h2>
            {program.process.map((step, index) => (
              <span key={step}><em>{index + 1}</em> {step}</span>
            ))}
          </motion.div>
        </section>

        <section className="pp-duration-section">
          <div>
            <p>Choose duration</p>
            <h2>Duration ရွေးပြီး payment ဆက်လုပ်ပါ</h2>
          </div>
          <div className="pp-duration-detail-grid">
            {program.durations.map((duration) => (
              <motion.div key={duration.months} whileTap={{ scale: 0.985 }} whileHover={{ y: -4 }}>
                <Link href={`/miniapp/checkout/${program.key}?months=${duration.months}`}>
                  <span>{duration.label}</span>
                  <strong>{formatMmk(duration.price)}</strong>
                  <em>{duration.note}</em>
                  <i className="ph ph-arrow-right" />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
