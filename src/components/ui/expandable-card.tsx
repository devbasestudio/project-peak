"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"

interface ExpandableCardProps {
  title: string
  src: string
  description: string
  children?: React.ReactNode
  className?: string
  classNameExpanded?: string
  [key: string]: any
}

export function ExpandableCard({
  title,
  src,
  description,
  children,
  className,
  classNameExpanded,
  ...props
}: ExpandableCardProps) {
  const [active, setActive] = React.useState(false)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const id = React.useId()

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActive(false)
      }
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setActive(false)
      }
    }

    if (active) {
      window.addEventListener("keydown", onKeyDown)
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [active])

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="exp-card-backdrop"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && (
          <div className="exp-card-dialog-container">
            <motion.div
              layoutId={`card-${title}-${id}`}
              ref={cardRef}
              className={`exp-card-dialog ${classNameExpanded || ""}`}
              {...props}
            >
              <motion.div layoutId={`image-${title}-${id}`} className="exp-card-dialog-img-container">
                <img
                  src={src}
                  alt={title}
                  className="exp-card-dialog-img"
                />
              </motion.div>
              <div className="exp-card-dialog-body">
                <div className="exp-card-dialog-header">
                  <div>
                    <motion.p
                      layoutId={`description-${description}-${id}`}
                      className="exp-card-dialog-subtitle"
                    >
                      {description}
                    </motion.p>
                    <motion.h3
                      layoutId={`title-${title}-${id}`}
                      className="exp-card-dialog-title"
                    >
                      {title}
                    </motion.h3>
                  </div>
                  <motion.button
                    aria-label="Close card"
                    layoutId={`button-${title}-${id}`}
                    className="exp-card-dialog-close-btn"
                    onClick={() => setActive(false)}
                  >
                    <motion.div
                      animate={{ rotate: active ? 45 : 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                      </svg>
                    </motion.div>
                  </motion.button>
                </div>
                <div className="exp-card-dialog-content">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="exp-card-dialog-text"
                  >
                    {children}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        role="dialog"
        aria-labelledby={`card-title-${id}`}
        aria-modal={active ? "true" : "false"}
        layoutId={`card-${title}-${id}`}
        onClick={() => setActive(true)}
        className={`exp-card-collapsed ${className || ""}`}
      >
        <div className="exp-card-collapsed-wrapper">
          <motion.div layoutId={`image-${title}-${id}`} className="exp-card-collapsed-img-container">
            <img
              src={src}
              alt={title}
              className="exp-card-collapsed-img"
            />
          </motion.div>
          <div className="exp-card-collapsed-info">
            <div className="exp-card-collapsed-text">
              <motion.p
                layoutId={`description-${description}-${id}`}
                className="exp-card-collapsed-subtitle"
              >
                {description}
              </motion.p>
              <motion.h3
                layoutId={`title-${title}-${id}`}
                className="exp-card-collapsed-title"
              >
                {title}
              </motion.h3>
            </div>
            <motion.button
              aria-label="Open card"
              layoutId={`button-${title}-${id}`}
              className="exp-card-collapsed-open-btn"
            >
              <motion.div
                animate={{ rotate: active ? 45 : 0 }}
                transition={{ duration: 0.4 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              </motion.div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
