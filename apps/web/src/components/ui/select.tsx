"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  name?: string;
  options: SelectOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
};

export function Select({
  name,
  options,
  defaultValue = "",
  value: controlled,
  onChange,
  required,
  disabled,
  placeholder,
  className = "",
  id,
  "aria-label": ariaLabel,
}: Props) {
  const autoId = useId();
  const listId = `${autoId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const selected = controlled ?? internal;
  const selectedOption = options.find((o) => o.value === selected);
  const label =
    selectedOption?.label ||
    placeholder ||
    options[0]?.label ||
    "";

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: string) {
    if (controlled === undefined) setInternal(next);
    onChange?.(next);
    setOpen(false);
  }

  function onTriggerKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`bb-select ${open ? "is-open" : ""} ${disabled ? "is-disabled" : ""} ${className}`.trim()}
    >
      {name ? (
        <input type="hidden" name={name} value={selected} required={required} />
      ) : null}
      <button
        type="button"
        id={id}
        className="bb-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
      >
        <span className="bb-select-value">{label}</span>
        <span className="bb-select-chevron" aria-hidden>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          className="bb-select-menu"
          role="listbox"
          aria-activedescendant={
            selected ? `${autoId}-opt-${selected}` : undefined
          }
        >
          {options.map((opt) => {
            const isSelected = opt.value === selected;
            return (
              <li key={`${opt.value}::${opt.label}`} role="presentation">
                <button
                  type="button"
                  id={`${autoId}-opt-${opt.value || "empty"}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`bb-select-option${isSelected ? " is-selected" : ""}`}
                  onClick={() => choose(opt.value)}
                >
                  <span className="bb-select-check" aria-hidden>
                    {isSelected ? (
                      <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                        <path
                          d="M4 10.5L8 14.5L16 5.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                  <span>{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
