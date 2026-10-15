import type { Locale } from "@/lib/api";

/**
 * Default content for the public information pages (About, FAQ, Privacy, Terms).
 *
 * Placeholders filled from Settings at render time:
 *   {org}   organization name (falls back to the site name)
 *   {email} contact email
 * Links use [text](/path); paths starting with "/" are prefixed with the page locale.
 *
 * The Privacy Policy describes what this system actually stores (see apps/api models and auth).
 * Have the site owner review the Privacy Policy and Terms before relying on them; they are
 * standard defaults, not legal advice.
 */

export type StaticBlock = { heading?: string; paragraphs?: string[]; list?: string[] };
export type StaticPageContent = {
  title: string;
  lead: string;
  description: string;
  /** ISO date shown as "Last updated" (policies only). */
  updated?: string;
  sections: StaticBlock[];
};
export type StaticPageId = "about" | "faq" | "privacy" | "terms";

const POLICY_DATE = "2026-10-15";

const en: Record<StaticPageId, StaticPageContent> = {
  about: {
    title: "About us",
    lead: "{org} is an online knowledge center for accounting, finance, tax, customs duties, auditing and Lao law.",
    description: "Who we are, what {org} offers, and who it is for.",
    sections: [
      {
        heading: "What we offer",
        list: [
          "A library of documents, forms and guides, organized by category and year.",
          "Practice quizzes to test and strengthen your knowledge.",
          "Member and VIP access to in-depth materials and downloadable files.",
        ],
      },
      {
        heading: "Who it is for",
        paragraphs: [
          "Accountants, business owners, students and anyone who needs clear reference material on accounting, tax and regulations in the Lao PDR.",
        ],
      },
      {
        heading: "Our approach",
        paragraphs: [
          "We aim to keep materials accurate, clearly organized and up to date. Each document shows its category and year and, where relevant, the date it takes effect.",
          "Content is for general information and education. For decisions about your own situation, check the official source or consult a qualified professional.",
        ],
      },
      {
        heading: "Contact us",
        paragraphs: ["Questions or suggestions? Visit our [contact page](/contact) or read the [frequently asked questions](/faq)."],
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    lead: "Answers to common questions about using {org}.",
    description: "Answers about accounts, membership, VIP access, downloads and sign-in on {org}.",
    sections: [
      { heading: "What is {org}?", paragraphs: ["An online knowledge center with documents, guides and quizzes on accounting, finance, tax, customs duties, auditing and Lao law."] },
      { heading: "Do I need an account?", paragraphs: ["No account is needed to browse public content. [Register](/auth/register) for free to read member content and download files."] },
      {
        heading: "What is the difference between Member and VIP?",
        list: [
          "Member: free after registration. Read member content and download member files.",
          "VIP: everything in Member, plus in-depth VIP documents and VIP downloads. See [VIP benefits](/vip).",
        ],
      },
      { heading: "How do I download a file?", paragraphs: ["Sign in, open a document, and use Download in its Files section. Files marked VIP require an active VIP membership."] },
      { heading: "I forgot my password. What should I do?", paragraphs: ["Use [Forgot password?](/auth/forgot-password) on the sign-in page. We will email you a reset link, which is valid for one hour."] },
      { heading: "Can I sign in with Google?", paragraphs: ["Yes. You can also link or unlink Google from [My account](/account) at any time."] },
      { heading: "Is the content professional advice?", paragraphs: ["No. It is general information and education. See our [Terms of Use](/terms)."] },
      { heading: "How do you use my personal information?", paragraphs: ["Only to run your account and the service. Read the [Privacy Policy](/privacy)."] },
      { heading: "How can I contact you?", paragraphs: ["Email {email} or use the [contact page](/contact)."] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    lead: "This policy explains what personal information {org} collects when you use this website, how we use it, and the choices you have.",
    description: "How {org} collects, uses and protects your personal information.",
    updated: POLICY_DATE,
    sections: [
      {
        heading: "1. Information we collect",
        list: [
          "Account details: your name and email address, and optionally your phone number and profile photo.",
          "Google sign-in: if you choose it, your Google account ID, name, email address and profile picture.",
          "Membership: your membership level (Member or VIP) and its start and end dates.",
          "Security records: when you sign in, the date, IP address and browser type of the session.",
        ],
      },
      {
        heading: "2. How we use your information",
        list: [
          "To create and run your account and sign you in.",
          "To give you the member and VIP content you are entitled to.",
          "To send account emails, such as email verification and password reset.",
          "To keep the service secure and prevent misuse.",
        ],
        paragraphs: ["We do not sell your personal information or use it for advertising."],
      },
      {
        heading: "3. Cookies and browser storage",
        paragraphs: ["We only use what the website needs to work:"],
        list: [
          "A sign-in cookie that keeps you logged in. It expires after 7 days or when you sign out.",
          "A temporary cookie used during Google sign-in. It expires after 10 minutes.",
          "Your light or dark theme preference, saved in your browser.",
        ],
      },
      {
        heading: "4. Sharing",
        paragraphs: [
          "We share information only when needed to run the service: with Google when you choose Google sign-in, with providers that host the website or send our emails on our behalf, or when the law requires it.",
        ],
      },
      {
        heading: "5. How long we keep information",
        paragraphs: ["We keep account information while your account is active. Sign-in records are kept for security. You can ask us to delete your account at any time."],
      },
      {
        heading: "6. Security",
        paragraphs: [
          "Passwords are stored using strong one-way hashing, and the website uses encrypted connections (HTTPS). No system is completely secure, but we take reasonable steps to protect your information.",
        ],
      },
      {
        heading: "7. Your choices",
        list: [
          "Update your name, phone number and photo in [My account](/account).",
          "Change your password, or link or unlink Google sign-in.",
          "Ask us for a copy of your information, or to correct or delete it, by emailing {email}.",
        ],
      },
      { heading: "8. Children", paragraphs: ["This website is intended for adults and professionals. We do not knowingly collect information from children under 16."] },
      { heading: "9. Changes to this policy", paragraphs: ["We may update this policy. The date at the top of this page shows when it last changed."] },
      { heading: "10. Contact", paragraphs: ["Questions about privacy: {email}."] },
    ],
  },
  terms: {
    title: "Terms of Use",
    lead: "These terms apply to your use of the {org} website. By using the website or creating an account, you agree to them.",
    description: "The terms that apply to using {org}, its content and accounts.",
    updated: POLICY_DATE,
    sections: [
      { heading: "1. Using the website", paragraphs: ["You can browse public content without an account. Some content and downloads require a Member or VIP account."] },
      {
        heading: "2. Your account",
        list: [
          "Give accurate information when you register.",
          "Keep your password private. You are responsible for activity on your account.",
          "We may suspend accounts that break these terms.",
        ],
      },
      { heading: "3. Membership and VIP", paragraphs: ["Member access is free after registration. VIP access is granted by {org} for the period shown in your account and ends when that period expires or is cancelled."] },
      {
        heading: "4. Use of content",
        paragraphs: [
          "Content is provided for your personal use and your organization's internal use. Do not republish, sell or distribute documents without our written permission. Official laws and regulations remain the property of the authorities that issue them.",
        ],
      },
      {
        heading: "5. Acceptable use",
        list: [
          "Do not try to access accounts or areas you are not authorized to use.",
          "Do not disrupt the service or download content in bulk with automated tools.",
          "Do not upload or share harmful or unlawful material.",
        ],
      },
      {
        heading: "6. Not professional advice",
        paragraphs: [
          "Content is for general information and education only. It is not legal, tax, accounting or financial advice. Laws and rates change, so always check the official source or consult a qualified professional before making decisions.",
        ],
      },
      {
        heading: "7. Limitation of liability",
        paragraphs: ["The website is provided “as is”. To the extent permitted by law, {org} is not liable for losses arising from use of the content or from the service being temporarily unavailable."],
      },
      { heading: "8. Changes to these terms", paragraphs: ["We may update these terms. Continuing to use the website after a change means you accept the updated terms."] },
      { heading: "9. Governing law", paragraphs: ["These terms are governed by the laws of the Lao People's Democratic Republic."] },
      { heading: "10. Contact", paragraphs: ["Questions about these terms: {email}."] },
    ],
  },
};

const lo: Record<StaticPageId, StaticPageContent> = {
  about: {
    title: "ກ່ຽວກັບພວກເຮົາ",
    lead: "{org} ເປັນສູນຄວາມຮູ້ອອນລາຍດ້ານການບັນຊີ, ການເງິນ, ພາສີ, ພາສີອາກອນຂາເຂົ້າ-ຂາອອກ, ການກວດສອບ ແລະ ກົດໝາຍລາວ.",
    description: "ພວກເຮົາແມ່ນໃຜ, {org} ໃຫ້ບໍລິການຫຍັງ ແລະ ເໝາະສົມກັບໃຜ.",
    sections: [
      {
        heading: "ສິ່ງທີ່ພວກເຮົາໃຫ້ບໍລິການ",
        list: [
          "ຄັງເອກະສານ, ແບບຟອມ ແລະ ຄູ່ມື ທີ່ຈັດເປັນໝວດ ແລະ ປີ.",
          "ແບບທົດສອບ ເພື່ອທົບທວນ ແລະ ເພີ່ມພູນຄວາມຮູ້.",
          "ການເຂົ້າເຖິງເນື້ອຫາສະເພາະສະມາຊິກ ແລະ VIP ພ້ອມໄຟລ໌ດາວໂຫຼດ.",
        ],
      },
      {
        heading: "ເໝາະສົມກັບໃຜ",
        paragraphs: ["ນັກບັນຊີ, ເຈົ້າຂອງທຸລະກິດ, ນັກສຶກສາ ແລະ ທຸກຄົນທີ່ຕ້ອງການເອກະສານອ້າງອີງທີ່ຊັດເຈນ ກ່ຽວກັບການບັນຊີ, ພາສີ ແລະ ລະບຽບການໃນ ສປປ ລາວ."],
      },
      {
        heading: "ແນວທາງຂອງພວກເຮົາ",
        paragraphs: [
          "ພວກເຮົາມຸ່ງໝັ້ນໃຫ້ເອກະສານຖືກຕ້ອງ, ຈັດລຽງເປັນລະບົບ ແລະ ທັນສະໄໝ. ເອກະສານແຕ່ລະສະບັບ ສະແດງໝວດ, ປີ ແລະ ວັນທີມີຜົນບັງຄັບໃຊ້ (ຖ້າມີ).",
          "ເນື້ອຫາມີໄວ້ເພື່ອເປັນຂໍ້ມູນທົ່ວໄປ ແລະ ການສຶກສາ. ກ່ອນຕັດສິນໃຈໃນກໍລະນີຂອງທ່ານ, ກະລຸນາກວດສອບກັບແຫຼ່ງທາງການ ຫຼື ປຶກສາຜູ້ຊ່ຽວຊານ.",
        ],
      },
      { heading: "ຕິດຕໍ່ພວກເຮົາ", paragraphs: ["ມີຄຳຖາມ ຫຼື ຄຳແນະນຳ? ເຂົ້າໄປທີ່[ໜ້າຕິດຕໍ່](/contact) ຫຼື ອ່ານ[ຄຳຖາມທີ່ພົບເລື້ອຍ](/faq)."] },
    ],
  },
  faq: {
    title: "ຄຳຖາມທີ່ພົບເລື້ອຍ",
    lead: "ຄຳຕອບສຳລັບຄຳຖາມທົ່ວໄປ ກ່ຽວກັບການນຳໃຊ້ {org}.",
    description: "ຄຳຕອບກ່ຽວກັບບັນຊີຜູ້ໃຊ້, ສະມາຊິກ, VIP, ການດາວໂຫຼດ ແລະ ການເຂົ້າສູ່ລະບົບ {org}.",
    sections: [
      { heading: "{org} ແມ່ນຫຍັງ?", paragraphs: ["ສູນຄວາມຮູ້ອອນລາຍ ທີ່ມີເອກະສານ, ຄູ່ມື ແລະ ແບບທົດສອບ ດ້ານການບັນຊີ, ການເງິນ, ພາສີ, ພາສີອາກອນຂາເຂົ້າ-ຂາອອກ, ການກວດສອບ ແລະ ກົດໝາຍລາວ."] },
      { heading: "ຕ້ອງມີບັນຊີຜູ້ໃຊ້ບໍ?", paragraphs: ["ບໍ່ຈຳເປັນ ສຳລັບການເບິ່ງເນື້ອຫາສາທາລະນະ. [ລົງທະບຽນ](/auth/register) ຟຣີ ເພື່ອອ່ານເນື້ອຫາສຳລັບສະມາຊິກ ແລະ ດາວໂຫຼດໄຟລ໌."] },
      {
        heading: "ສະມາຊິກ ແລະ VIP ຕ່າງກັນແນວໃດ?",
        list: [
          "ສະມາຊິກ: ຟຣີຫຼັງລົງທະບຽນ. ອ່ານເນື້ອຫາ ແລະ ດາວໂຫຼດໄຟລ໌ສຳລັບສະມາຊິກ.",
          "VIP: ໄດ້ທຸກຢ່າງຂອງສະມາຊິກ ພ້ອມເອກະສານເຈາະເລິກ ແລະ ໄຟລ໌ສຳລັບ VIP. ເບິ່ງ[ສິດທິພິເສດ VIP](/vip).",
        ],
      },
      { heading: "ດາວໂຫຼດໄຟລ໌ແນວໃດ?", paragraphs: ["ເຂົ້າສູ່ລະບົບ, ເປີດເອກະສານ ແລ້ວກົດດາວໂຫຼດ ໃນສ່ວນໄຟລ໌. ໄຟລ໌ທີ່ໝາຍ VIP ຕ້ອງມີສະມາຊິກ VIP ທີ່ຍັງມີຜົນ."] },
      { heading: "ລືມລະຫັດຜ່ານ ຕ້ອງເຮັດແນວໃດ?", paragraphs: ["ໃຊ້[ລືມລະຫັດຜ່ານ?](/auth/forgot-password) ໃນໜ້າເຂົ້າສູ່ລະບົບ. ພວກເຮົາຈະສົ່ງລິ້ງຕັ້ງລະຫັດໃໝ່ໄປທາງອີເມວ, ລິ້ງໃຊ້ໄດ້ 1 ຊົ່ວໂມງ."] },
      { heading: "ເຂົ້າສູ່ລະບົບດ້ວຍ Google ໄດ້ບໍ?", paragraphs: ["ໄດ້. ທ່ານສາມາດເຊື່ອມຕໍ່ ຫຼື ຍົກເລີກການເຊື່ອມຕໍ່ Google ໄດ້ທີ່[ບັນຊີຂອງຂ້ອຍ](/account)."] },
      { heading: "ເນື້ອຫາເປັນຄຳແນະນຳທາງວິຊາຊີບບໍ?", paragraphs: ["ບໍ່ແມ່ນ. ເປັນຂໍ້ມູນທົ່ວໄປ ແລະ ເພື່ອການສຶກສາ. ເບິ່ງ[ເງື່ອນໄຂການນຳໃຊ້](/terms)."] },
      { heading: "ພວກເຮົານຳໃຊ້ຂໍ້ມູນສ່ວນຕົວຂອງທ່ານແນວໃດ?", paragraphs: ["ພຽງເພື່ອດຳເນີນບັນຊີ ແລະ ການບໍລິການຂອງທ່ານເທົ່ານັ້ນ. ອ່ານ[ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ](/privacy)."] },
      { heading: "ຕິດຕໍ່ພວກເຮົາແນວໃດ?", paragraphs: ["ອີເມວ {email} ຫຼື ໃຊ້[ໜ້າຕິດຕໍ່](/contact)."] },
    ],
  },
  privacy: {
    title: "ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ",
    lead: "ນະໂຍບາຍນີ້ອະທິບາຍວ່າ {org} ເກັບກຳຂໍ້ມູນສ່ວນຕົວຫຍັງແດ່ ເມື່ອທ່ານນຳໃຊ້ເວັບໄຊນີ້, ນຳໃຊ້ແນວໃດ ແລະ ທ່ານມີທາງເລືອກຫຍັງແດ່.",
    description: "{org} ເກັບກຳ, ນຳໃຊ້ ແລະ ປົກປ້ອງຂໍ້ມູນສ່ວນຕົວຂອງທ່ານແນວໃດ.",
    updated: POLICY_DATE,
    sections: [
      {
        heading: "1. ຂໍ້ມູນທີ່ພວກເຮົາເກັບກຳ",
        list: [
          "ຂໍ້ມູນບັນຊີ: ຊື່ ແລະ ອີເມວ, ແລະ ເບີໂທ ແລະ ຮູບໂປຣໄຟລ໌ (ຖ້າທ່ານໃສ່).",
          "ການເຂົ້າສູ່ລະບົບດ້ວຍ Google: ຖ້າທ່ານເລືອກ, ລະຫັດບັນຊີ Google, ຊື່, ອີເມວ ແລະ ຮູບໂປຣໄຟລ໌.",
          "ສະມາຊິກ: ລະດັບສະມາຊິກ (ສະມາຊິກ ຫຼື VIP) ແລະ ວັນທີເລີ່ມຕົ້ນ-ສິ້ນສຸດ.",
          "ບັນທຶກຄວາມປອດໄພ: ເມື່ອເຂົ້າສູ່ລະບົບ, ວັນທີ, ທີ່ຢູ່ IP ແລະ ປະເພດບຣາວເຊີ ຂອງການເຂົ້າໃຊ້.",
        ],
      },
      {
        heading: "2. ພວກເຮົານຳໃຊ້ຂໍ້ມູນແນວໃດ",
        list: [
          "ເພື່ອສ້າງ ແລະ ດຳເນີນບັນຊີຂອງທ່ານ ແລະ ໃຫ້ທ່ານເຂົ້າສູ່ລະບົບ.",
          "ເພື່ອໃຫ້ທ່ານເຂົ້າເຖິງເນື້ອຫາສະມາຊິກ ແລະ VIP ຕາມສິດຂອງທ່ານ.",
          "ເພື່ອສົ່ງອີເມວກ່ຽວກັບບັນຊີ ເຊັ່ນ: ຢືນຢັນອີເມວ ແລະ ຕັ້ງລະຫັດຜ່ານໃໝ່.",
          "ເພື່ອຮັກສາຄວາມປອດໄພ ແລະ ປ້ອງກັນການນຳໃຊ້ໃນທາງທີ່ຜິດ.",
        ],
        paragraphs: ["ພວກເຮົາບໍ່ຂາຍຂໍ້ມູນສ່ວນຕົວຂອງທ່ານ ແລະ ບໍ່ນຳໃຊ້ເພື່ອການໂຄສະນາ."],
      },
      {
        heading: "3. ຄຸກກີ້ ແລະ ການບັນທຶກໃນບຣາວເຊີ",
        paragraphs: ["ພວກເຮົາໃຊ້ພຽງສິ່ງທີ່ຈຳເປັນ ເພື່ອໃຫ້ເວັບໄຊເຮັດວຽກໄດ້:"],
        list: [
          "ຄຸກກີ້ເຂົ້າສູ່ລະບົບ ທີ່ຮັກສາການເຂົ້າສູ່ລະບົບຂອງທ່ານ. ໝົດອາຍຸພາຍໃນ 7 ວັນ ຫຼື ເມື່ອທ່ານອອກຈາກລະບົບ.",
          "ຄຸກກີ້ຊົ່ວຄາວ ລະຫວ່າງການເຂົ້າສູ່ລະບົບດ້ວຍ Google. ໝົດອາຍຸພາຍໃນ 10 ນາທີ.",
          "ການຕັ້ງຄ່າໂໝດສະຫວ່າງ ຫຼື ມືດ ທີ່ບັນທຶກໄວ້ໃນບຣາວເຊີຂອງທ່ານ.",
        ],
      },
      { heading: "4. ການແບ່ງປັນຂໍ້ມູນ", paragraphs: ["ພວກເຮົາແບ່ງປັນຂໍ້ມູນສະເພາະເມື່ອຈຳເປັນສຳລັບການບໍລິການ: ກັບ Google ເມື່ອທ່ານເລືອກເຂົ້າສູ່ລະບົບດ້ວຍ Google, ກັບຜູ້ໃຫ້ບໍລິການທີ່ໂຮສເວັບໄຊ ຫຼື ສົ່ງອີເມວແທນພວກເຮົາ, ຫຼື ເມື່ອກົດໝາຍກຳນົດ."] },
      { heading: "5. ໄລຍະເວລາການເກັບຮັກສາ", paragraphs: ["ພວກເຮົາເກັບຮັກສາຂໍ້ມູນບັນຊີ ຕາບໃດທີ່ບັນຊີຂອງທ່ານຍັງນຳໃຊ້ຢູ່. ບັນທຶກການເຂົ້າສູ່ລະບົບເກັບໄວ້ເພື່ອຄວາມປອດໄພ. ທ່ານສາມາດຂໍໃຫ້ລຶບບັນຊີໄດ້ທຸກເວລາ."] },
      { heading: "6. ຄວາມປອດໄພ", paragraphs: ["ລະຫັດຜ່ານຖືກເກັບແບບເຂົ້າລະຫັດທາງດຽວທີ່ເຂັ້ມແຂງ ແລະ ເວັບໄຊໃຊ້ການເຊື່ອມຕໍ່ແບບເຂົ້າລະຫັດ (HTTPS). ບໍ່ມີລະບົບໃດປອດໄພ 100%, ແຕ່ພວກເຮົາໃຊ້ມາດຕະການທີ່ເໝາະສົມ ເພື່ອປົກປ້ອງຂໍ້ມູນຂອງທ່ານ."] },
      {
        heading: "7. ທາງເລືອກຂອງທ່ານ",
        list: [
          "ແກ້ໄຂຊື່, ເບີໂທ ແລະ ຮູບໄດ້ທີ່[ບັນຊີຂອງຂ້ອຍ](/account).",
          "ປ່ຽນລະຫັດຜ່ານ, ຫຼື ເຊື່ອມຕໍ່/ຍົກເລີກການເຊື່ອມຕໍ່ Google.",
          "ຂໍສຳເນົາຂໍ້ມູນ, ຂໍແກ້ໄຂ ຫຼື ລຶບຂໍ້ມູນ ໂດຍອີເມວຫາ {email}.",
        ],
      },
      { heading: "8. ເດັກນ້ອຍ", paragraphs: ["ເວັບໄຊນີ້ມີໄວ້ສຳລັບຜູ້ໃຫຍ່ ແລະ ຜູ້ເຮັດວຽກວິຊາຊີບ. ພວກເຮົາບໍ່ເກັບກຳຂໍ້ມູນຂອງເດັກອາຍຸຕ່ຳກວ່າ 16 ປີໂດຍເຈດຕະນາ."] },
      { heading: "9. ການປ່ຽນແປງນະໂຍບາຍ", paragraphs: ["ພວກເຮົາອາດປັບປຸງນະໂຍບາຍນີ້. ວັນທີດ້ານເທິງສະແດງການປັບປຸງຄັ້ງລ່າສຸດ."] },
      { heading: "10. ຕິດຕໍ່", paragraphs: ["ຄຳຖາມກ່ຽວກັບຄວາມເປັນສ່ວນຕົວ: {email}."] },
    ],
  },
  terms: {
    title: "ເງື່ອນໄຂການນຳໃຊ້",
    lead: "ຂໍ້ກຳນົດນີ້ໃຊ້ກັບການນຳໃຊ້ເວັບໄຊ {org}. ການນຳໃຊ້ເວັບໄຊ ຫຼື ການສ້າງບັນຊີ ຖືວ່າທ່ານຍອມຮັບຂໍ້ກຳນົດເຫຼົ່ານີ້.",
    description: "ຂໍ້ກຳນົດໃນການນຳໃຊ້ {org}, ເນື້ອຫາ ແລະ ບັນຊີຜູ້ໃຊ້.",
    updated: POLICY_DATE,
    sections: [
      { heading: "1. ການນຳໃຊ້ເວັບໄຊ", paragraphs: ["ທ່ານສາມາດເບິ່ງເນື້ອຫາສາທາລະນະໄດ້ໂດຍບໍ່ຕ້ອງມີບັນຊີ. ເນື້ອຫາ ແລະ ໄຟລ໌ບາງສ່ວນ ຕ້ອງມີບັນຊີສະມາຊິກ ຫຼື VIP."] },
      {
        heading: "2. ບັນຊີຂອງທ່ານ",
        list: [
          "ໃຫ້ຂໍ້ມູນທີ່ຖືກຕ້ອງເມື່ອລົງທະບຽນ.",
          "ຮັກສາລະຫັດຜ່ານເປັນຄວາມລັບ. ທ່ານຮັບຜິດຊອບຕໍ່ການເຄື່ອນໄຫວໃນບັນຊີຂອງທ່ານ.",
          "ພວກເຮົາອາດລະງັບບັນຊີທີ່ລະເມີດຂໍ້ກຳນົດນີ້.",
        ],
      },
      { heading: "3. ສະມາຊິກ ແລະ VIP", paragraphs: ["ສິດສະມາຊິກແມ່ນຟຣີຫຼັງລົງທະບຽນ. ສິດ VIP ໃຫ້ໂດຍ {org} ຕາມໄລຍະເວລາທີ່ສະແດງໃນບັນຊີຂອງທ່ານ ແລະ ສິ້ນສຸດເມື່ອໝົດອາຍຸ ຫຼື ຖືກຍົກເລີກ."] },
      { heading: "4. ການນຳໃຊ້ເນື້ອຫາ", paragraphs: ["ເນື້ອຫາມີໄວ້ເພື່ອການນຳໃຊ້ສ່ວນຕົວ ແລະ ພາຍໃນອົງກອນຂອງທ່ານ. ຫ້າມເຜີຍແຜ່ຄືນ, ຂາຍ ຫຼື ແຈກຢາຍເອກະສານ ໂດຍບໍ່ໄດ້ຮັບອະນຸຍາດເປັນລາຍລັກອັກສອນ. ກົດໝາຍ ແລະ ລະບຽບການທາງການ ຍັງເປັນຂອງໜ່ວຍງານທີ່ອອກ."] },
      {
        heading: "5. ການນຳໃຊ້ທີ່ຍອມຮັບໄດ້",
        list: [
          "ຫ້າມພະຍາຍາມເຂົ້າເຖິງບັນຊີ ຫຼື ສ່ວນທີ່ທ່ານບໍ່ມີສິດ.",
          "ຫ້າມລົບກວນການບໍລິການ ຫຼື ດາວໂຫຼດເນື້ອຫາຈຳນວນຫຼາຍດ້ວຍເຄື່ອງມືອັດຕະໂນມັດ.",
          "ຫ້າມອັບໂຫຼດ ຫຼື ແບ່ງປັນເນື້ອຫາທີ່ເປັນອັນຕະລາຍ ຫຼື ຜິດກົດໝາຍ.",
        ],
      },
      { heading: "6. ບໍ່ແມ່ນຄຳແນະນຳທາງວິຊາຊີບ", paragraphs: ["ເນື້ອຫາມີໄວ້ເພື່ອເປັນຂໍ້ມູນທົ່ວໄປ ແລະ ການສຶກສາເທົ່ານັ້ນ, ບໍ່ແມ່ນຄຳແນະນຳດ້ານກົດໝາຍ, ພາສີ, ການບັນຊີ ຫຼື ການເງິນ. ກົດໝາຍ ແລະ ອັດຕາຕ່າງໆອາດປ່ຽນແປງ, ກະລຸນາກວດສອບກັບແຫຼ່ງທາງການ ຫຼື ປຶກສາຜູ້ຊ່ຽວຊານກ່ອນຕັດສິນໃຈ."] },
      { heading: "7. ຂອບເຂດຄວາມຮັບຜິດຊອບ", paragraphs: ["ເວັບໄຊໃຫ້ບໍລິການ “ຕາມສະພາບ”. ພາຍໃຕ້ຂອບເຂດທີ່ກົດໝາຍອະນຸຍາດ, {org} ບໍ່ຮັບຜິດຊອບຕໍ່ຄວາມເສຍຫາຍທີ່ເກີດຈາກການນຳໃຊ້ເນື້ອຫາ ຫຼື ການບໍລິການຂັດຂ້ອງຊົ່ວຄາວ."] },
      { heading: "8. ການປ່ຽນແປງຂໍ້ກຳນົດ", paragraphs: ["ພວກເຮົາອາດປັບປຸງຂໍ້ກຳນົດເຫຼົ່ານີ້. ການນຳໃຊ້ເວັບໄຊຕໍ່ຫຼັງການປ່ຽນແປງ ຖືວ່າທ່ານຍອມຮັບຂໍ້ກຳນົດໃໝ່."] },
      { heading: "9. ກົດໝາຍທີ່ນຳໃຊ້", paragraphs: ["ຂໍ້ກຳນົດເຫຼົ່ານີ້ຢູ່ພາຍໃຕ້ກົດໝາຍຂອງ ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ."] },
      { heading: "10. ຕິດຕໍ່", paragraphs: ["ຄຳຖາມກ່ຽວກັບຂໍ້ກຳນົດ: {email}."] },
    ],
  },
};

const CONTENT: Record<Locale, Record<StaticPageId, StaticPageContent>> = { en, lo };

export function staticPageContent(locale: Locale, id: StaticPageId) {
  return CONTENT[locale][id];
}

/** Replaces {org} and {email} with values from Settings. */
export function fillPlaceholders(text: string, values: { org: string; email: string }) {
  return text.replaceAll("{org}", values.org).replaceAll("{email}", values.email);
}
