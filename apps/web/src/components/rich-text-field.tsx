"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize-html";

const TEXT = {
  lo: {
    paragraph: "ຂໍ້ຄວາມ",
    heading: "ຫົວຂໍ້",
    subheading: "ຫົວຂໍ້ຍ່ອຍ",
    bold: "ໂຕໜາ",
    italic: "ໂຕອຽງ",
    underline: "ຂີດກ້ອງ",
    bullets: "ລາຍການແບບຈຸດ",
    numbers: "ລາຍການແບບເລກ",
    link: "ລິ້ງ",
    linkPrompt: "ໃສ່ລິ້ງ (https://…)",
    unlink: "ລຶບລິ້ງ",
    clear: "ລຶບຮູບແບບ",
    html: "HTML",
    visual: "ແບບປົກກະຕິ",
    badLink: "ລິ້ງຕ້ອງເລີ່ມດ້ວຍ https://, http:// ຫຼື mailto:",
  },
  en: {
    paragraph: "Paragraph",
    heading: "Heading",
    subheading: "Subheading",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    bullets: "Bulleted list",
    numbers: "Numbered list",
    link: "Link",
    linkPrompt: "Enter a link (https://…)",
    unlink: "Remove link",
    clear: "Clear formatting",
    html: "HTML",
    visual: "Visual",
    badLink: "Links must start with https://, http:// or mailto:",
  },
} as const;

/** True when the editor holds no visible text (e.g. only "<p><br></p>"). */
function isBlank(html: string) {
  return !html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, "")
    .trim();
}

/**
 * Formatted editor for document body HTML. Submits through a hidden input with `name`, so the
 * form and API keep receiving the same HTML string as before (the API sanitizes it again).
 */
export function RichTextField({
  name,
  locale,
  defaultValue,
  placeholder,
  labelId,
}: {
  name: string;
  locale: Locale;
  defaultValue: string;
  placeholder: string;
  labelId: string;
}) {
  const text = TEXT[locale];
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue);
  const [sourceMode, setSourceMode] = useState(false);
  const [notice, setNotice] = useState("");
  const placeholderId = useId();

  // Load the stored HTML once; afterwards the browser owns the editable DOM.
  useEffect(() => {
    if (editorRef.current)
      editorRef.current.innerHTML = sanitizeHtml(defaultValue);
  }, [defaultValue]);

  function sync() {
    const value = editorRef.current?.innerHTML || "";
    setHtml(isBlank(value) ? "" : value);
  }

  function run(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  function addLink() {
    const url = window.prompt(text.linkPrompt, "https://");
    if (!url) return;
    if (!/^(https?:\/\/|mailto:)/i.test(url.trim())) {
      setNotice(text.badLink);
      return;
    }
    setNotice("");
    run("createLink", url.trim());
  }

  function toggleSource() {
    if (sourceMode && editorRef.current) {
      editorRef.current.innerHTML = sanitizeHtml(html);
      sync();
    }
    setSourceMode((on) => !on);
  }

  type ToolId =
    | "p"
    | "h2"
    | "h3"
    | "bold"
    | "italic"
    | "underline"
    | "ul"
    | "ol"
    | "link"
    | "unlink"
    | "clear";
  const tools: Array<{
    id: ToolId;
    label: string;
    content: string;
    className?: string;
  }> = [
    { id: "p", label: text.paragraph, content: "¶" },
    { id: "h2", label: text.heading, content: "H2", className: "font-bold" },
    {
      id: "h3",
      label: text.subheading,
      content: "H3",
      className: "font-semibold",
    },
    { id: "bold", label: text.bold, content: "B", className: "font-bold" },
    { id: "italic", label: text.italic, content: "I", className: "italic" },
    {
      id: "underline",
      label: text.underline,
      content: "U",
      className: "underline",
    },
    { id: "ul", label: text.bullets, content: "• —" },
    { id: "ol", label: text.numbers, content: "1." },
    { id: "link", label: text.link, content: "🔗" },
    { id: "unlink", label: text.unlink, content: "⛓︎̸" },
    { id: "clear", label: text.clear, content: "T̸" },
  ];

  function onTool(id: ToolId) {
    if (id === "p" || id === "h2" || id === "h3")
      return run("formatBlock", `<${id}>`);
    if (id === "ul") return run("insertUnorderedList");
    if (id === "ol") return run("insertOrderedList");
    if (id === "link") return addLink();
    if (id === "clear") return run("removeFormat");
    return run(id);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-bb-border bg-[var(--bb-surface)] focus-within:outline-2 focus-within:outline-[color-mix(in_srgb,var(--bb-blue)_35%,transparent)]">
      <div
        role="toolbar"
        aria-label={text.paragraph}
        className="flex flex-wrap items-center gap-0.5 border-b border-bb-border bg-bb-muted px-1.5 py-1"
      >
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.label}
            aria-label={tool.label}
            disabled={sourceMode}
            // Keep the text selection in the editor while clicking the toolbar.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onTool(tool.id)}
            className={`min-h-8 min-w-8 rounded-md px-2 text-sm text-[var(--bb-text)] hover:bg-[var(--bb-surface)] disabled:opacity-40 ${tool.className || ""}`}
          >
            {tool.content}
          </button>
        ))}
        <button
          type="button"
          onClick={toggleSource}
          aria-pressed={sourceMode}
          className="ml-auto min-h-8 rounded-md px-2 text-xs font-semibold text-bb-text-muted hover:bg-[var(--bb-surface)]"
        >
          {sourceMode ? text.visual : text.html}
        </button>
      </div>

      <div className={sourceMode ? "hidden" : "relative"}>
        {isBlank(html) ? (
          <p
            id={placeholderId}
            className="pointer-events-none absolute left-3 right-3 top-3 text-sm leading-relaxed text-bb-text-muted"
          >
            {placeholder}
          </p>
        ) : null}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-labelledby={labelId}
          aria-describedby={isBlank(html) ? placeholderId : undefined}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onBlur={sync}
          onPaste={(event) => {
            // Paste as plain text so formatting from Word or web pages does not come along.
            event.preventDefault();
            document.execCommand(
              "insertText",
              false,
              event.clipboardData.getData("text/plain"),
            );
            sync();
          }}
          className="doc-body min-h-48 px-3 py-3 text-[0.95rem] focus:outline-none"
        />
      </div>

      {sourceMode ? (
        <textarea
          aria-labelledby={labelId}
          className="min-h-48 w-full bg-[var(--bb-surface)] px-3 py-3 font-mono text-sm text-[var(--bb-text)] focus:outline-none"
          spellCheck={false}
          value={html}
          onChange={(event) => setHtml(event.target.value)}
        />
      ) : null}

      {notice ? (
        <p
          className="border-t border-bb-border px-3 py-1.5 text-xs text-rose-700 dark:text-rose-300"
          role="alert"
        >
          {notice}
        </p>
      ) : null}
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
