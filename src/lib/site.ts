import type { IconName } from "./icons";

// All business details and page copy live here so they can be edited in one place.
// Source: Business Profile of Infinity Soma Wellness Clinic (Pty) Ltd + design mockup.

export const business = {
  name: "Infinity Soma Wellness Clinic",
  legalName: "Infinity Soma Wellness Clinic (Pty) Ltd",
  registration: "2023/958227/07",
  url: "https://www.infinitysoma.co.za",
  email: "info@infinitysoma.co.za",
  phoneDisplay: "+27 63 880 4946",
  phoneE164: "+27638804946",
  whatsapp: "https://wa.me/27638804946",
  instagramHandle: "infinitysomawellness",
  instagram: "https://www.instagram.com/infinitysomawellness/",
  // The flyer gives "somawellness_2023"; Facebook usernames can't contain "_", so this opens a Facebook search
  // for it until the clinic sends the page's real link.
  facebook: "https://www.facebook.com/search/top?q=somawellness_2023",
  tiktokHandle: "soma_wellness2023",
  tiktok: "https://www.tiktok.com/@soma_wellness2023",
  address: {
    lines: ["Suite G09b, Musgrave Park", "18 Musgrave Road, Musgrave", "Durban, 4001"],
    street: "Suite G09b, Musgrave Park, 18 Musgrave Road",
    locality: "Durban",
    region: "KwaZulu-Natal",
    postalCode: "4001",
    country: "ZA",
  },
  qcto: "05-QCTO/SDP210826181430",
  hwseta: "T110003506",
  founded: 2023,
  founder: "Banathi Sihonqo",
};

// Social profiles shown in the footer, contact page and mobile menu.
export const socials: { name: string; href: string; icon: IconName; handle: string }[] = [
  { name: "Instagram", href: business.instagram, icon: "instagram", handle: `@${business.instagramHandle}` },
  { name: "WhatsApp", href: business.whatsapp, icon: "whatsapp", handle: business.phoneDisplay },
  { name: "Facebook", href: business.facebook, icon: "facebook", handle: "somawellness_2023" },
  { name: "TikTok", href: business.tiktok, icon: "tiktok", handle: `@${business.tiktokHandle}` },
];

export const navLinks = [
  { href: "/treatments", label: "Treatments" },
  { href: "/skincare", label: "Skincare" },
  { href: "/corporate", label: "Corporate" },
  { href: "/training", label: "Training" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

// Shown in full on the About and Training pages.
export const accreditations: { icon: IconName; body: string; bodyFull: string; title: string; numberLabel: string; number: string }[] = [
  {
    icon: "shield",
    body: "QCTO",
    bodyFull: "QCTO · Quality Council for Trades & Occupations",
    title: "Skills Development Provider (SDP)",
    numberLabel: "Accreditation number",
    number: business.qcto,
  },
  {
    icon: "award",
    body: "HWSETA",
    bodyFull: "HWSETA · Health and Welfare Sector Education and Training Authority",
    title: "HWSETA Stakeholder",
    numberLabel: "T-Number",
    number: business.hwseta,
  },
];

export const trust: { icon: IconName; title: string; sub: string }[] = [
  { icon: "shield", title: "QCTO Accredited SDP", sub: `Accreditation No. ${business.qcto}` },
  { icon: "award", title: "HWSETA Stakeholder", sub: `T-Number ${business.hwseta}` },
  { icon: "pin", title: "Mobile & In-Clinic", sub: "Musgrave, Durban & beyond" },
  { icon: "people", title: "Qualified Somatologists", sub: "Backed by academic experts" },
];

export type Service = {
  id: string;
  href: string;
  img: string;
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  items: { icon: IconName; label: string }[];
};

export const services: Service[] = [
  {
    id: "wellness",
    href: "/treatments",
    img: "/images/wellness-hot-stones.jpg",
    alt: "Hot stone massage",
    eyebrow: "WELLNESS & THERAPY",
    title: "Wellness and Therapeutic Services",
    body: "Professional treatments designed to promote relaxation, recovery and overall wellbeing.",
    cta: "View treatments",
    items: [
      { icon: "leaf", label: "Swedish Massage" },
      { icon: "hand", label: "Deep Tissue Massage" },
      { icon: "drop", label: "Aromatherapy Massage" },
      { icon: "stones", label: "Hot Stone Massage" },
      { icon: "bump", label: "Prenatal Massage" },
      { icon: "run", label: "Reflexology & Pedicures" },
    ],
  },
  {
    id: "skincare",
    href: "/skincare",
    img: "/images/skincare-facial-steamer.jpg",
    alt: "Somatologist applying a facial mask beside a steamer",
    eyebrow: "RADIANT, HEALTHY SKIN",
    title: "Advanced Skincare and Aesthetics",
    body: "Evidence-based skincare solutions to reveal your natural radiance.",
    cta: "View skincare",
    items: [
      { icon: "face", label: "Somatology Facials" },
      { icon: "flask", label: "Chemical Peels" },
      { icon: "blade", label: "Dermaplaning" },
      { icon: "jar", label: "Microdermabrasion & LED" },
      { icon: "ageing", label: "Needling & Lamprobe" },
      { icon: "sparkle", label: "Ladies' & Men's Waxing" },
    ],
  },
  {
    id: "corporate",
    href: "/corporate",
    img: "/images/corporate-seated-massage.jpg",
    alt: "Therapist giving a seated neck and shoulder massage at an expo",
    eyebrow: "HEALTHIER PEOPLE, STRONGER BUSINESS",
    title: "Corporate Wellness Solutions",
    body: "Customised wellness programmes to improve employee wellbeing, boost productivity and create healthier workplaces.",
    cta: "Corporate wellness",
    items: [
      { icon: "person", label: "Workplace Massage" },
      { icon: "calendar", label: "Wellness Days" },
      { icon: "shield", label: "Stress Management" },
      { icon: "monitor", label: "Ergonomic Assessments" },
      { icon: "pulse", label: "Health Screening" },
      { icon: "firstaid", label: "First Aid Training" },
    ],
  },
];

export const quals: { icon: IconName; title: string; saqa: string }[] = [
  { icon: "face", title: "Manual Skin Care Therapist", saqa: "121667" },
  { icon: "hand", title: "Body Massage Therapist", saqa: "121673" },
  { icon: "sparkle", title: "Beauty Therapist", saqa: "121607" },
];

export const pillars: { icon: IconName; label: string }[] = [
  { icon: "award", label: "Experienced Professionals" },
  { icon: "book", label: "Evidence-Based Practice" },
  { icon: "shield", label: "Accredited Training" },
  { icon: "people", label: "Community Focused" },
  { icon: "pin", label: "Mobile & Clinic Services" },
];

export const gallery = [
  { img: "/images/team-uniforms.jpg", alt: "Infinity Soma team in clinic uniforms", caption: "Our team at Musgrave Park" },
  { img: "/images/community-event-team.jpg", alt: "Infinity Soma team and guests beside the clinic banner at a wellness event", caption: "Community wellness activation" },
  { img: "/images/race-day-tent.jpg", alt: "Infinity Soma massage tent at a race event", caption: "Athlete recovery on race day" },
  { img: "/images/mobile-therapist.jpg", alt: "Therapist carrying a portable massage bed", caption: "Mobile treatments, wherever you are" },
];

export const corporateProgrammes: { icon: IconName; title: string }[] = [
  { icon: "person", title: "Workplace Massage Programmes" },
  { icon: "calendar", title: "Employee Wellness Days" },
  { icon: "award", title: "Executive Wellness Packages" },
  { icon: "shield", title: "Stress Management Programmes" },
  { icon: "leaf", title: "Burnout Prevention Workshops" },
  { icon: "monitor", title: "Ergonomic Assessments" },
  { icon: "pulse", title: "Lifestyle Risk Assessments" },
  { icon: "book", title: "Mental Wellness Education" },
  { icon: "firstaid", title: "First Aid Training" },
  { icon: "people", title: "Health Screening Events" },
];

export const trainingSolutions = [
  "Occupational Qualifications",
  "Skills Programmes",
  "Workplace Training",
  "Learnership Support",
  "Skills Development Partnerships",
];

export const socialImpact = [
  "Youth employment opportunities",
  "Women empowerment initiatives",
  "Rural skills development programmes",
  "Entrepreneurship support",
  "Community health promotion",
  "Professional skills development",
  "Mental wellness awareness",
  "Accessible wellness services",
];

export const enquiryKinds = {
  general: {
    label: "general",
    interests: ["Wellness & massage treatment", "Skincare & aesthetics", "Athlete recovery package", "Mobile treatment (home, office or event)", "Corporate wellness", "Occupational training", "Something else"],
  },
  corporate: {
    label: "corporate wellness",
    interests: ["Employee wellness day", "Workplace massage programme", "Executive wellness package", "Stress & burnout workshop", "Health screening event", "Ergonomic assessment", "First aid training", "Something else"],
  },
  training: {
    label: "training",
    interests: ["Manual Skin Care Therapist (SAQA 121667)", "Body Massage Therapist (SAQA 121673)", "Beauty Therapist (SAQA 121607)", "Skills programme / learnership", "Skills development partnership"],
  },
} as const;

export type EnquiryKind = keyof typeof enquiryKinds;
