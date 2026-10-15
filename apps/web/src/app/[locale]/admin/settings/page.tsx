"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { FormField, LoadingState, SuccessBanner } from "@/components/ui";
import {
  clientDeleteAdminSettingsAsset,
  clientGetAdminSettings,
  clientListAdminCategories,
  clientMe,
  clientPatchAdminSettings,
  clientUploadAdminSettingsAsset,
} from "@/lib/client-api";
import type { Locale } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";

type SettingsForm = Record<string, string>;
type AssetKind =
  "logo" | "login-logo" | "system-logo" | "favicon" | "default-cover";
/** Text in both page languages; Lao pages show `lo`, English pages show `en`. */
type Text = { lo: string; en: string };
type FieldDef = {
  key: string;
  label: Text;
  type?: string;
  hint?: Text;
  placeholder?: string;
  required?: boolean;
  counter?: [number, number];
};
type Section = {
  id: string;
  title?: Text;
  description?: Text;
  fields?: FieldDef[];
  assets?: boolean;
};

const pick = (locale: Locale, text: Text) => text[locale];

// One scrolling page. The first section keeps the original settings layout (same fields, order and labels).
const SECTIONS: Section[] = [
  {
    id: "general",
    title: { lo: "ທົ່ວໄປ", en: "General" },
    description: {
      lo: "ຊື່ເວັບໄຊ, ຊ່ອງທາງຕິດຕໍ່ ແລະ SEO.",
      en: "Site names, contact links and SEO.",
    },
    fields: [
      {
        key: "site_name_lo",
        label: { lo: "ຊື່ເວັບໄຊ (ພາສາລາວ)", en: "Site name (Lao)" },
        required: true,
      },
      {
        key: "site_name_en",
        label: { lo: "ຊື່ເວັບໄຊ (ພາສາອັງກິດ)", en: "Site name (English)" },
        required: true,
      },
      {
        key: "timezone",
        label: { lo: "ເຂດເວລາ", en: "Timezone" },
        required: true,
        placeholder: "Asia/Vientiane",
      },
      {
        key: "contact_email",
        label: { lo: "ອີເມວຕິດຕໍ່", en: "Contact email" },
        type: "email",
      },
      {
        key: "whatsapp_number",
        label: { lo: "WhatsApp", en: "WhatsApp" },
        type: "tel",
        placeholder: "+8562012345678",
      },
      {
        key: "facebook_url",
        label: { lo: "ລິ້ງ Facebook", en: "Facebook URL" },
        type: "url",
      },
      {
        key: "tiktok_url",
        label: { lo: "ລິ້ງ TikTok", en: "TikTok URL" },
        type: "url",
      },
      {
        key: "default_seo_title_lo",
        label: { lo: "ຫົວຂໍ້ SEO (ພາສາລາວ)", en: "SEO title (Lao)" },
        counter: [30, 60],
      },
      {
        key: "default_seo_title_en",
        label: { lo: "ຫົວຂໍ້ SEO (ພາສາອັງກິດ)", en: "SEO title (English)" },
        counter: [30, 60],
      },
      {
        key: "default_meta_description_lo",
        label: {
          lo: "ຄຳອະທິບາຍ Meta (ພາສາລາວ)",
          en: "Meta description (Lao)",
        },
        type: "textarea",
        counter: [120, 160],
      },
      {
        key: "default_meta_description_en",
        label: {
          lo: "ຄຳອະທິບາຍ Meta (ພາສາອັງກິດ)",
          en: "Meta description (English)",
        },
        type: "textarea",
        counter: [120, 160],
      },
    ],
  },
  {
    id: "organization",
    title: { lo: "ອົງກອນ ແລະ ການຕິດຕໍ່", en: "Organization & contact" },
    description: {
      lo: "ສະແດງຢູ່ສ່ວນທ້າຍເວັບ ແລະ ໜ້າຕິດຕໍ່. ປ່ອຍວ່າງເພື່ອເຊື່ອງ.",
      en: "Shown in the footer and on the Contact page. Leave blank to hide.",
    },
    fields: [
      {
        key: "organization_name",
        label: { lo: "ຊື່ອົງກອນ", en: "Organization name" },
      },
      { key: "system_name", label: { lo: "ຊື່ລະບົບ", en: "System name" } },
      {
        key: "contact_phone",
        label: { lo: "ເບີໂທລະສັບ", en: "Phone" },
        type: "tel",
        placeholder: "+856 21 123 456",
      },
      {
        key: "website",
        label: { lo: "ເວັບໄຊ", en: "Website" },
        type: "url",
        placeholder: "https://example.com",
      },
      {
        key: "address",
        label: { lo: "ທີ່ຢູ່", en: "Address" },
        type: "textarea",
      },
      {
        key: "description",
        label: { lo: "ຄຳອະທິບາຍ", en: "Description" },
        type: "textarea",
        hint: {
          lo: "ສະແດງຢູ່ລຸ່ມໂລໂກ້ໃນສ່ວນທ້າຍເວັບ.",
          en: "Shown under the logo in the footer.",
        },
      },
    ],
  },
  {
    id: "branding",
    title: { lo: "ໂລໂກ້ ແລະ ຮູບພາບ", en: "Logo & images" },
    description: {
      lo: "ເບິ່ງຕົວຢ່າງໄດ້ທີ່ນີ້, ນຳໃຊ້ເມື່ອບັນທຶກ.",
      en: "Previewed here, applied when you save.",
    },
    assets: true,
  },
  {
    id: "documents",
    title: { lo: "ເອກະສານ", en: "Documents" },
    description: {
      lo: "ຄ່າເລີ່ມຕົ້ນສຳລັບເອກະສານໃໝ່.",
      en: "Defaults for new documents.",
    },
    fields: [
      {
        key: "default_document_category",
        label: { lo: "ໝວດເອກະສານເລີ່ມຕົ້ນ", en: "Default document category" },
      },
      {
        key: "default_document_status",
        label: { lo: "ສະຖານະເອກະສານເລີ່ມຕົ້ນ", en: "Default document status" },
      },
      {
        key: "allowed_file_types",
        label: { lo: "ປະເພດໄຟລ໌ທີ່ອະນຸຍາດ", en: "Allowed file types" },
        placeholder: "pdf,docx,xlsx",
        hint: {
          lo: "ຂັ້ນດ້ວຍເຄື່ອງໝາຍຈຸດ (,): pdf, doc, docx, xls, xlsx, csv, txt, zip, jpg, jpeg, png, webp.",
          en: "Comma-separated: pdf, doc, docx, xls, xlsx, csv, txt, zip, jpg, jpeg, png, webp.",
        },
      },
      {
        key: "max_file_size_mb",
        label: { lo: "ຂະໜາດໄຟລ໌ສູງສຸດ (MB)", en: "Maximum file size (MB)" },
        type: "number",
      },
      {
        key: "document_number_format",
        label: { lo: "ຮູບແບບເລກທີເອກະສານ", en: "Document numbering format" },
        placeholder: "DOC-2026-0001",
      },
    ],
  },
  {
    id: "appearance",
    title: { lo: "ຮູບແບບການສະແດງຜົນ", en: "Appearance" },
    description: {
      lo: "ສີໃຊ້ໃນໂໝດແຈ້ງ; ຄວາມຄົມຊັດຖືກກວດຢູ່ລຸ່ມແຕ່ລະສີ.",
      en: "Colors apply in light mode; contrast is checked under each color.",
    },
    fields: [
      {
        key: "primary_color",
        label: { lo: "ສີຫຼັກ", en: "Primary color" },
        type: "color",
      },
      {
        key: "secondary_color",
        label: { lo: "ສີຮອງ", en: "Secondary color" },
        type: "color",
      },
      {
        key: "accent_color",
        label: { lo: "ສີເນັ້ນ", en: "Accent color" },
        type: "color",
      },
      {
        key: "application_title",
        label: { lo: "ຊື່ແອັບພລິເຄຊັນ", en: "Application title" },
      },
      {
        key: "sidebar_title",
        label: { lo: "ຫົວຂໍ້ແຖບຂ້າງຂອງຜູ້ດູແລ", en: "Admin sidebar title" },
      },
      {
        key: "dashboard_title",
        label: { lo: "ຫົວຂໍ້ແຜງຄວບຄຸມ", en: "Dashboard title" },
      },
      {
        key: "footer_text",
        label: { lo: "ຂໍ້ຄວາມສ່ວນທ້າຍເວັບ", en: "Footer text" },
        hint: {
          lo: "ປ່ອຍວ່າງໄວ້ເພື່ອໃຊ້ “© ປີ ຊື່ອົງກອນ”.",
          en: "Leave blank to use “© year organization name”.",
        },
      },
    ],
  },
];

type BuiltInImage = { src: string; dark?: boolean; note: Text };

// Images the website uses when nothing has been uploaded (see brand-logo.tsx, site-footer.tsx, app/layout.tsx).
const ASSETS: Array<{
  kind: AssetKind;
  label: Text;
  key: string;
  hint: Text;
  builtIn: BuiltInImage;
}> = [
  {
    kind: "logo",
    label: { lo: "ໂລໂກ້ເວັບໄຊ", en: "Site logo" },
    key: "logo_url",
    hint: {
      lo: "ໂລໂກ້ຫຼັກ, ໃຊ້ທຸກບ່ອນ ເວັ້ນເສຍແຕ່ໄດ້ຕັ້ງໂລໂກ້ສະເພາະຂ້າງລຸ່ມ.",
      en: "Main logo, used everywhere unless a specific logo below is set.",
    },
    builtIn: {
      src: "/brand/logo-light.png",
      note: {
        lo: "ກຳລັງໃຊ້ຢູ່: ໂລໂກ້ BAN BUNSI ມາດຕະຖານຂອງລະບົບ.",
        en: "In use now: the built-in BAN BUNSI logo.",
      },
    },
  },
  {
    kind: "system-logo",
    label: { lo: "ໂລໂກ້ສ່ວນຫົວ ແລະ ໜ້າຜູ້ດູແລ", en: "Header & admin logo" },
    key: "system_logo_url",
    hint: {
      lo: "ສ່ວນຫົວເວັບໄຊ, ແຖບຂ້າງຂອງຜູ້ດູແລ ແລະ ສ່ວນທ້າຍເວັບ.",
      en: "Website header, admin sidebar and footer.",
    },
    builtIn: {
      src: "/brand/logo-light.png",
      note: {
        lo: "ກຳລັງໃຊ້ຢູ່: ໂລໂກ້ເວັບໄຊຂ້າງເທິງ (ໂລໂກ້ມາດຕະຖານ ຖ້າບໍ່ໄດ້ອັບໂຫຼດ).",
        en: "In use now: the site logo above (built-in if none is uploaded).",
      },
    },
  },
  {
    kind: "login-logo",
    label: { lo: "ໂລໂກ້ໜ້າເຂົ້າສູ່ລະບົບ", en: "Login page logo" },
    key: "login_logo_url",
    hint: {
      lo: "ໜ້າເຂົ້າສູ່ລະບົບ ແລະ ລົງທະບຽນ (ພື້ນຫຼັງສີເຂັ້ມ).",
      en: "Sign-in and registration pages (dark background).",
    },
    builtIn: {
      src: "/brand/logo-dark.png",
      dark: true,
      note: {
        lo: "ກຳລັງໃຊ້ຢູ່: ໂລໂກ້ມາດຕະຖານສຳລັບພື້ນຫຼັງສີເຂັ້ມ.",
        en: "In use now: the built-in logo for dark backgrounds.",
      },
    },
  },
  {
    kind: "favicon",
    label: { lo: "Favicon (ໄອຄອນແຖບບຣາວເຊີ)", en: "Favicon" },
    key: "favicon_url",
    hint: {
      lo: "ໄອຄອນໃນແຖບບຣາວເຊີ. ໃຊ້ PNG ຮູບສີ່ຫຼ່ຽມຈະຕຸລັດ, ເຊັ່ນ 512 × 512 px.",
      en: "Browser tab icon. Use a square PNG, e.g. 512 × 512 px.",
    },
    builtIn: {
      src: "/favicon-192.png",
      note: {
        lo: "ກຳລັງໃຊ້ຢູ່: ໄອຄອນ BAN BUNSI ມາດຕະຖານ.",
        en: "In use now: the built-in BAN BUNSI icon.",
      },
    },
  },
  {
    kind: "default-cover",
    label: { lo: "ໜ້າປົກເອກະສານເລີ່ມຕົ້ນ", en: "Default document cover" },
    key: "default_cover_url",
    hint: {
      lo: "ສະແດງສຳລັບເອກະສານທີ່ບໍ່ມີໜ້າປົກຂອງຕົນເອງ.",
      en: "Shown for documents without their own cover.",
    },
    builtIn: {
      src: "/brand/categories/cat-accounting.jpg",
      note: {
        lo: "ກຳລັງໃຊ້ຢູ່: ແຕ່ລະເອກະສານສະແດງຮູບຂອງໝວດຂອງມັນ.",
        en: "In use now: each document shows the image of its category.",
      },
    },
  },
];

function toForm(data: Record<string, unknown>): SettingsForm {
  const form = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value == null ? "" : String(value),
    ]),
  );
  form.max_file_size_mb = String(
    Number(data.max_file_size_bytes || 2 * 1024 * 1024) / (1024 * 1024),
  );
  return form;
}

const MAX_ASSET_BYTES = 2 * 1024 * 1024;
const ASSET_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** A staged image change: a new file to upload, or removal of the saved image. */
type PendingAsset = { file: File; preview: string } | "remove";

function assetFileError(locale: Locale, file: File) {
  if (
    !ASSET_TYPES.includes(file.type) &&
    !/\.(jpe?g|png|webp)$/i.test(file.name)
  ) {
    return pick(locale, {
      lo: "ກະລຸນາເລືອກຮູບ JPG, PNG ຫຼື WebP.",
      en: "Choose a JPG, PNG, or WebP image.",
    });
  }
  if (file.size > MAX_ASSET_BYTES)
    return pick(locale, {
      lo: "ຮູບຕ້ອງມີຂະໜາດບໍ່ເກີນ 2 MiB.",
      en: "Image must be 2 MiB or smaller.",
    });
  return "";
}

function AssetControl({
  locale,
  kind,
  label,
  hint,
  builtIn,
  savedSrc,
  pending,
  disabled,
  onSelect,
  onRemove,
  onUndo,
}: {
  locale: Locale;
  kind: AssetKind;
  label: string;
  hint: string;
  builtIn: BuiltInImage;
  savedSrc: string;
  pending?: PendingAsset;
  disabled: boolean;
  onSelect: (kind: AssetKind, file: File) => void;
  onRemove: (kind: AssetKind) => void;
  onUndo: (kind: AssetKind) => void;
}) {
  const [failedSrc, setFailedSrc] = useState("");
  const src = pending === "remove" ? "" : pending?.preview || savedSrc;
  // With nothing uploaded (or a removal pending), preview the built-in image the website falls back to.
  const usingBuiltIn = !src;
  const shown = src || builtIn.src;
  const isCover = kind === "default-cover";
  const L = (lo: string, en: string) => pick(locale, { lo, en });
  return (
    <section className="grid gap-4 border-b border-bb-border py-4 last:border-0 sm:grid-cols-[120px_minmax(0,1fr)]">
      <div
        className={`relative flex h-24 w-28 items-center justify-center overflow-hidden rounded-md border border-bb-border ${usingBuiltIn && builtIn.dark ? "bg-[#0b1f6b]" : "bg-bb-surface"}`}
      >
        {failedSrc !== shown ? (
          <Image
            src={shown}
            alt={L(`ຕົວຢ່າງ: ${label}`, `${label} preview`)}
            fill
            sizes="112px"
            unoptimized={!shown.startsWith("/")}
            onError={() => setFailedSrc(shown)}
            className={isCover ? "object-cover" : "object-contain p-2"}
          />
        ) : (
          <span className="text-xs text-bb-text-muted">
            {L("ບໍ່ສາມາດສະແດງຕົວຢ່າງ", "Preview unavailable")}
          </span>
        )}
        {usingBuiltIn ? (
          <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[10px] font-medium text-white">
            {L("ມາດຕະຖານ", "Built-in")}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            {label}
            {pending ? (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                {pending === "remove"
                  ? L("ຈະຖືກລຶບ", "Will be removed")
                  : L("ຍັງບໍ່ໄດ້ບັນທຶກ", "Unsaved")}
              </span>
            ) : null}
          </h3>
          <p className="mt-1 text-xs text-bb-text-muted">{hint}</p>
          {usingBuiltIn ? (
            <p className="mt-0.5 text-xs text-bb-text-muted">
              {pending === "remove"
                ? L(
                    "ຫຼັງຈາກບັນທຶກ, ເວັບໄຊຈະກັບໄປໃຊ້ຮູບມາດຕະຖານ.",
                    "After saving, the website goes back to the built-in image.",
                  )
                : `${pick(locale, builtIn.note)} ${L("ອັບໂຫຼດຮູບເພື່ອປ່ຽນແທນ.", "Upload an image to replace it.")}`}
            </p>
          ) : null}
          <p className="mt-0.5 text-xs text-bb-text-muted">
            {L(
              "JPG, PNG ຫຼື WebP · ບໍ່ເກີນ 2 MB",
              "JPG, PNG, or WebP · up to 2 MB",
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label
            className={`btn-secondary ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            {src ? L("ປ່ຽນຮູບ", "Replace") : L("ອັບໂຫຼດ", "Upload")}
            <input
              className="sr-only"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              disabled={disabled}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) onSelect(kind, file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          {pending ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={disabled}
              onClick={() => onUndo(kind)}
            >
              {L("ຍົກເລີກການປ່ຽນ", "Undo")}
            </button>
          ) : null}
          {savedSrc && pending !== "remove" ? (
            <button
              type="button"
              className="btn-secondary text-rose-600"
              disabled={disabled}
              onClick={() => onRemove(kind)}
            >
              {L("ລຶບ", "Remove")}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** WCAG contrast ratio of a #RRGGBB color against white text. */
function contrastWithWhite(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return 1.05 / (luminance + 0.05);
}

export default function AdminSettingsPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const L = (lo: string, en: string) => pick(locale, { lo, en });
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [savedForm, setSavedForm] = useState<SettingsForm | null>(null);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [pendingAssets, setPendingAssets] = useState<
    Partial<Record<AssetKind, PendingAsset>>
  >({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-dismiss success notifications; errors stay until the next action.
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function loadSettings() {
    const settings = toForm(await clientGetAdminSettings());
    setForm(settings);
    setSavedForm(settings);
  }

  useEffect(() => {
    clientMe()
      .then(async (user) => {
        if (!["admin", "owner"].includes(user.staff_role)) {
          router.replace(`/${locale}/admin`);
          return;
        }
        await Promise.all([
          loadSettings(),
          clientListAdminCategories(locale).then(({ items }) =>
            setCategories(items),
          ),
        ]);
      })
      .catch(() => router.replace(`/${locale}/auth/login`));
  }, [locale, router]);

  function releasePreview(pending?: PendingAsset) {
    if (pending && pending !== "remove") URL.revokeObjectURL(pending.preview);
  }

  function stageAsset(kind: AssetKind, next?: PendingAsset) {
    setPendingAssets((current) => {
      releasePreview(current[kind]);
      const updated = { ...current };
      if (next) updated[kind] = next;
      else delete updated[kind];
      return updated;
    });
  }

  function selectAsset(kind: AssetKind, file: File) {
    const problem = assetFileError(locale, file);
    if (problem) {
      setMessage("");
      setError(problem);
      return;
    }
    setError("");
    stageAsset(kind, { file, preview: URL.createObjectURL(file) });
  }

  const fieldsDirty = Boolean(
    form &&
    savedForm &&
    Object.keys(form).some((key) => form[key] !== savedForm[key]),
  );
  const assetsDirty = Object.keys(pendingAssets).length > 0;
  const dirty = fieldsDirty || assetsDirty;

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function onCancel() {
    Object.values(pendingAssets).forEach(releasePreview);
    setPendingAssets({});
    setForm(savedForm);
    setError("");
    setMessage(L("ຍົກເລີກການປ່ຽນແປງແລ້ວ.", "Changes discarded."));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form || !dirty) return;
    setLoading(true);
    setError("");
    setMessage("");
    const failures: string[] = [];
    try {
      if (fieldsDirty) {
        const payload: Record<string, unknown> = { ...form };
        delete payload.max_file_size_mb;
        payload.max_file_size_bytes = Math.round(
          Number(form.max_file_size_mb || 2) * 1024 * 1024,
        );
        await clientPatchAdminSettings(payload);
      }
      const remaining: Partial<Record<AssetKind, PendingAsset>> = {};
      for (const [kind, pending] of Object.entries(pendingAssets) as Array<
        [AssetKind, PendingAsset]
      >) {
        const asset = ASSETS.find((item) => item.kind === kind);
        const label = asset ? pick(locale, asset.label) : kind;
        try {
          if (pending === "remove") await clientDeleteAdminSettingsAsset(kind);
          else await clientUploadAdminSettingsAsset(kind, pending.file);
          releasePreview(pending);
        } catch (reason) {
          remaining[kind] = pending;
          failures.push(
            `${label}: ${reason instanceof Error ? reason.message : L("ອັບໂຫຼດບໍ່ສຳເລັດ", "upload failed")}`,
          );
        }
      }
      setPendingAssets(remaining);
      // Fields were saved above, so it is safe to reset the form to the server's values.
      const settings = toForm(await clientGetAdminSettings());
      setSavedForm(settings);
      setForm(settings);
      window.dispatchEvent(new Event("brand-settings-updated"));
      router.refresh();
      if (failures.length)
        setError(
          `${L("ບາງຮູບບໍ່ໄດ້ຖືກບັນທຶກ.", "Some images were not saved.")} ${failures.join(" ")}`,
        );
      else
        setMessage(
          L("ບັນທຶກການຕັ້ງຄ່າສຳເລັດແລ້ວ.", "Settings saved successfully."),
        );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : t(locale, "loadError"),
      );
    } finally {
      setLoading(false);
    }
  }

  if (!form) return <LoadingState label={t(locale, "loading")} />;

  // Hard limit from the server (MAX_UPLOAD_MB); the Settings value cannot exceed it.
  const maxUploadMb = Math.floor(
    Number(form.max_upload_bytes || 14 * 1024 * 1024) / (1024 * 1024),
  );
  const update = (key: string, value: string) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));

  // What the site shows when a field is left blank (mirrors the fallbacks in the public pages and admin shell).
  const siteName =
    (locale === "en" ? form.site_name_en : form.site_name_lo) ||
    form.site_name_en ||
    "BAN BUNSI";
  const defaults: Record<string, string> = {
    organization_name: siteName,
    system_name: "BAN BUNSI",
    description: t(locale, "footerBlurb"),
    application_title: siteName,
    dashboard_title: t(locale, "dashboard"),
    footer_text: `© ${new Date().getFullYear()} ${form.organization_name || siteName}. ${t(locale, "allRights")}`,
    document_number_format: "DOC-2026-0001",
    primary_color: "#0036ad",
    secondary_color: "#061644",
    accent_color: "#27ae60",
    default_seo_title_lo:
      form.application_title || form.site_name_lo || "BAN BUNSI",
    default_seo_title_en:
      form.application_title || form.site_name_en || "BAN BUNSI",
  };

  function fieldHint(field: FieldDef) {
    const value = form?.[field.key] || "";
    const parts = [field.hint && pick(locale, field.hint)];
    if (defaults[field.key] && !value)
      parts.push(
        L(
          `ຖ້າປ່ອຍວ່າງ ຈະໃຊ້ຄ່າເລີ່ມຕົ້ນ: “${defaults[field.key]}”.`,
          `Blank uses the default: “${defaults[field.key]}”.`,
        ),
      );
    if (field.key === "max_file_size_mb") {
      parts.push(
        L(
          `ຕໍ່ໄຟລ໌, ບໍ່ເກີນ ${maxUploadMb} MB (ຂີດຈຳກັດການອັບໂຫຼດຂອງເຊີບເວີ).`,
          `Per file, up to ${maxUploadMb} MB (the server's upload limit).`,
        ),
      );
    }
    if (field.counter) {
      const [min, max] = field.counter;
      const length = [...value].length;
      const outside = length && (length < min || length > max);
      parts.push(
        L(
          `${length} ຕົວອັກສອນ${outside ? ` (ແນະນຳ ${min}–${max})` : ""}.`,
          `${length} characters${outside ? ` (recommended ${min}–${max})` : ""}.`,
        ),
      );
    }
    if (field.type === "color") {
      const ratio = contrastWithWhite(value || defaults[field.key] || "");
      // Accent is used for icons/highlights on white (non-text, 3:1); the others sit behind white text (4.5:1).
      const isAccent = field.key === "accent_color";
      const minimum = isAccent ? 3 : 4.5;
      const subject = isAccent
        ? L("ຄວາມຄົມຊັດກັບພື້ນສີຂາວ", "Contrast against a white background")
        : L("ຄວາມຄົມຊັດກັບຕົວໜັງສືສີຂາວ", "Contrast with white text");
      if (ratio)
        parts.push(
          ratio >= minimum
            ? `${subject} ${ratio.toFixed(1)}:1 — ${L("ຜ່ານມາດຕະຖານ WCAG AA.", "meets WCAG AA.")}`
            : `${subject} ${ratio.toFixed(1)}:1 — ${L(`ຕ່ຳກວ່າຂັ້ນຕ່ຳ ${minimum}:1; ກະລຸນາເລືອກສີທີ່ເຂັ້ມກວ່ານີ້.`, `below the ${minimum}:1 minimum; choose a darker color.`)}`,
        );
    }
    return parts.filter(Boolean).join(" ") || undefined;
  }

  function renderField(field: FieldDef) {
    const value = form?.[field.key] || "";
    if (field.key === "default_document_category") {
      return (
        <select
          className="input"
          value={value}
          onChange={(event) => update(field.key, event.target.value)}
        >
          <option value="">{L("ບໍ່ມີຄ່າເລີ່ມຕົ້ນ", "No default")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      );
    }
    if (field.key === "default_document_status") {
      return (
        <select
          className="input"
          value={value || "draft"}
          onChange={(event) => update(field.key, event.target.value)}
        >
          <option value="draft">{t(locale, "draft")}</option>
          <option value="published">{t(locale, "published")}</option>
          <option value="archived">{L("ເກັບໄວ້ໃນຄັງ", "Archived")}</option>
        </select>
      );
    }
    if (field.type === "textarea") {
      return (
        <textarea
          className="input min-h-24"
          placeholder={field.placeholder || defaults[field.key]}
          value={value}
          onChange={(event) => update(field.key, event.target.value)}
        />
      );
    }
    if (field.type === "color") {
      return (
        <div className="flex gap-2">
          <input
            aria-label={L(
              `ເລືອກ${pick(locale, field.label)}`,
              `${field.label.en} picker`,
            )}
            className="h-[2.85rem] w-16 shrink-0 cursor-pointer rounded-lg border border-bb-border bg-transparent p-1"
            type="color"
            value={value || defaults[field.key] || "#0036ad"}
            onChange={(event) => update(field.key, event.target.value)}
          />
          <input
            className="input"
            placeholder={defaults[field.key]}
            value={value}
            onChange={(event) => update(field.key, event.target.value)}
          />
        </div>
      );
    }
    const isSize = field.key === "max_file_size_mb";
    return (
      <input
        className="input"
        type={field.type || "text"}
        placeholder={field.placeholder || defaults[field.key]}
        required={field.required}
        min={isSize ? "0.1" : undefined}
        max={isSize ? String(maxUploadMb) : undefined}
        step={isSize ? "0.1" : undefined}
        value={value}
        onChange={(event) => update(field.key, event.target.value)}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{t(locale, "settings")}</h1>
      </header>
      <form onSubmit={onSubmit} className="space-y-4">
        {SECTIONS.map((section, index) => (
          <section
            key={section.id}
            aria-labelledby={
              section.title ? `settings-${section.id}` : undefined
            }
            className={
              index > 0
                ? "space-y-4 border-t border-bb-border pt-6"
                : "space-y-4"
            }
          >
            {section.title ? (
              <div>
                <h2 id={`settings-${section.id}`} className="text-lg font-bold">
                  {pick(locale, section.title)}
                </h2>
                {section.description ? (
                  <p className="mt-0.5 text-sm text-bb-text-muted">
                    {pick(locale, section.description)}
                  </p>
                ) : null}
              </div>
            ) : null}
            {section.fields?.map((field) => (
              <FormField
                key={field.key}
                label={
                  field.required
                    ? `${pick(locale, field.label)} ${L("(ຈຳເປັນ)", "(required)")}`
                    : pick(locale, field.label)
                }
                hint={fieldHint(field)}
              >
                {renderField(field)}
              </FormField>
            ))}
            {section.assets ? (
              <div>
                {ASSETS.map((asset) => (
                  <AssetControl
                    key={asset.kind}
                    locale={locale}
                    kind={asset.kind}
                    label={pick(locale, asset.label)}
                    hint={pick(locale, asset.hint)}
                    builtIn={asset.builtIn}
                    savedSrc={savedForm?.[asset.key] || ""}
                    pending={pendingAssets[asset.kind]}
                    disabled={loading}
                    onSelect={selectAsset}
                    onRemove={(kind) => stageAsset(kind, "remove")}
                    onUndo={(kind) => stageAsset(kind)}
                  />
                ))}
              </div>
            ) : null}
          </section>
        ))}
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-bb-border bg-[var(--bb-bg-muted)] py-4">
          <p className="text-sm text-bb-text-muted" aria-live="polite">
            {dirty
              ? L(
                  "ທ່ານມີການປ່ຽນແປງທີ່ຍັງບໍ່ໄດ້ບັນທຶກ.",
                  "You have unsaved changes.",
                )
              : L("ບັນທຶກການປ່ຽນແປງທັງໝົດແລ້ວ.", "All changes saved.")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={loading || !dirty}
              onClick={onCancel}
            >
              {t(locale, "cancel")}
            </button>
            <button
              className="btn-primary"
              disabled={loading || !dirty}
              type="submit"
            >
              {loading ? t(locale, "loading") : t(locale, "save")}
            </button>
          </div>
        </div>
      </form>
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:max-w-sm">
        {error ? (
          <div
            className="pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-lg"
            role="alert"
          >
            <span className="flex-1">{error}</span>
            <button
              type="button"
              className="font-semibold"
              aria-label={L("ປິດ", "Dismiss")}
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        ) : null}
        {message ? (
          <div className="pointer-events-auto w-full shadow-lg">
            <SuccessBanner>{message}</SuccessBanner>
          </div>
        ) : null}
      </div>
    </div>
  );
}
