"use client";

import {
  useEffect,
  useId,
  useMemo,
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
  /** Show a filter box in the menu. Defaults to on for lists longer than SEARCH_THRESHOLD. */
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
};

const SEARCH_THRESHOLD = 6;

function matches(label: string, query: string) {
  return label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

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
  searchable,
  searchPlaceholder = "Search…",
  noResultsText = "No matches",
}: Props) {
  const autoId = useId();
  const listId = `${autoId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [internal, setInternal] = useState(defaultValue);
  const selected = controlled ?? internal;
  const selectedOption = options.find((o) => o.value === selected);
  const label = selectedOption?.label || placeholder || options[0]?.label || "";
  const withSearch = searchable ?? options.length > SEARCH_THRESHOLD;
  const visible = useMemo(
    () => (query ? options.filter((o) => matches(o.label, query)) : options),
    [options, query],
  );
  const optionId = (index: number) => `${autoId}-opt-${index}`;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  // Focus the search box (or the list) when the menu opens.
  useEffect(() => {
    if (!open) return;
    if (withSearch) searchRef.current?.focus();
    else listRef.current?.focus();
  }, [open, withSearch]);

  // Keep the highlighted option in view while moving with the keyboard.
  useEffect(() => {
    if (!open) return;
    document
      .getElementById(optionId(active))
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open]);

  function openMenu() {
    if (disabled) return;
    setQuery("");
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === selected),
      ),
    );
    setOpen(true);
  }

  function close(returnFocus = true) {
    setOpen(false);
    setQuery("");
    if (returnFocus) triggerRef.current?.focus();
  }

  function choose(next: string) {
    if (controlled === undefined) setInternal(next);
    if (next !== selected) onChange?.(next);
    close();
  }

  function onTriggerKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openMenu();
    }
  }

  function onMenuKey(e: KeyboardEvent<HTMLElement>) {
    const last = visible.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i >= last ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? last : i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(Math.max(0, last));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = visible[active];
      if (option) choose(option.value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close(false);
    } else if (!withSearch && e.key.length === 1) {
      // Type-ahead: jump to the next option starting with the typed letter.
      const start = active + 1;
      const order = [...visible.slice(start), ...visible.slice(0, start)];
      const hit = order.find((o) =>
        o.label.toLocaleLowerCase().startsWith(e.key.toLocaleLowerCase()),
      );
      if (hit) setActive(visible.indexOf(hit));
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
        ref={triggerRef}
        type="button"
        id={id}
        className="bb-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
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
        // preventDefault stops a wrapping <label> from re-clicking the trigger.
        <div className="bb-select-menu" onClick={(e) => e.preventDefault()}>
          {withSearch ? (
            <div className="bb-select-search">
              <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden>
                <circle
                  cx="9"
                  cy="9"
                  r="5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M13.2 13.2L16.5 16.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <input
                ref={searchRef}
                type="search"
                value={query}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-controls={listId}
                aria-activedescendant={
                  visible.length ? optionId(active) : undefined
                }
                autoComplete="off"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onMenuKey}
              />
            </div>
          ) : null}
          <ul
            ref={listRef}
            id={listId}
            className="bb-select-list"
            role="listbox"
            aria-label={ariaLabel}
            tabIndex={withSearch ? -1 : 0}
            aria-activedescendant={
              !withSearch && visible.length ? optionId(active) : undefined
            }
            onKeyDown={withSearch ? undefined : onMenuKey}
          >
            {visible.length === 0 ? (
              <li className="bb-select-empty" role="presentation">
                {noResultsText}
              </li>
            ) : null}
            {visible.map((opt, index) => {
              const isSelected = opt.value === selected;
              return (
                <li
                  key={`${opt.value}::${opt.label}`}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  className={`bb-select-option${isSelected ? " is-selected" : ""}${index === active ? " is-active" : ""}`}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(opt.value)}
                >
                  <span className="bb-select-check" aria-hidden>
                    {isSelected ? (
                      <svg
                        viewBox="0 0 20 20"
                        width="14"
                        height="14"
                        fill="none"
                      >
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
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
