"use client";

import { useId, useState } from "react";
import type { FaqItem } from "@/lib/static-pages";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="faq-list">
      {items.map((item, index) => {
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-btn-${index}`;
        const isOpen = open === index;
        return (
          <div
            key={`${item.q}-${index}`}
            className={`faq-item${isOpen ? " is-open" : ""}`}
          >
            <h3 className="faq-item-q">
              <button
                type="button"
                id={buttonId}
                className="faq-item-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                <span>{item.q}</span>
                <span className="faq-item-icon" aria-hidden>
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="faq-item-a"
              hidden={!isOpen}
            >
              <p>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
