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
  instagramHandle: "soma_wellness2023",
  instagram: "https://www.instagram.com/soma_wellness2023/",
  address: {
    lines: ["Suite G09b, Musgrave Park", "18 Musgrave Road, Musgrave", "Durban, 4001"],
    street: "Suite G09b, Musgrave Park, 18 Musgrave Road",
    locality: "Durban",
    region: "KwaZulu-Natal",
    postalCode: "4001",
    country: "ZA",
  },
  // TODO: confirm with the client before launch.
  hours: null as string | null,
  qcto: "05-QCTO/SDP210826181430",
  hwseta: "T110003506",
  founded: 2023,
  founder: "Banathi Sihonqo",
};

export const navLinks = [
  { href: "#services", label: "Treatments" },
  { href: "#skincare", label: "Skincare" },
  { href: "#corporate", label: "Corporate" },
  { href: "#training", label: "Training" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export const trust: { icon: IconName; title: string; sub: string }[] = [
  { icon: "shield", title: "QCTO Accredited", sub: "Skills Development Provider" },
  { icon: "award", title: "HWSETA Stakeholder", sub: `T-Number ${business.hwseta}` },
  { icon: "pin", title: "Mobile & In-Clinic", sub: "Musgrave, Durban & beyond" },
  { icon: "people", title: "Qualified Somatologists", sub: "Backed by academic experts" },
];

export type Service = {
  id: string;
  img: string;
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  interest: string;
  items: { icon: IconName; label: string }[];
};

export const services: Service[] = [
  {
    id: "wellness",
    img: "/images/service-wellness.jpg",
    alt: "Hot stone massage",
    eyebrow: "WELLNESS & THERAPY",
    title: "Wellness and Therapeutic Services",
    body: "Professional treatments designed to promote relaxation, recovery and overall wellbeing.",
    cta: "Book a treatment",
    interest: "Wellness & massage treatment",
    items: [
      { icon: "leaf", label: "Swedish Massage" },
      { icon: "hand", label: "Deep Tissue Massage" },
      { icon: "drop", label: "Aromatherapy Massage" },
      { icon: "stones", label: "Hot Stone Therapy" },
      { icon: "bump", label: "Pregnancy Massage" },
      { icon: "run", label: "Sports Recovery" },
    ],
  },
  {
    id: "skincare",
    img: "/images/service-skincare.jpg",
    alt: "Facial treatment with a mask brush",
    eyebrow: "RADIANT, HEALTHY SKIN",
    title: "Advanced Skincare and Aesthetics",
    body: "Evidence-based skincare solutions to reveal your natural radiance.",
    cta: "Book a skin consultation",
    interest: "Skincare & aesthetics",
    items: [
      { icon: "face", label: "Skin Consultations" },
      { icon: "sparkle", label: "Deep Cleansing Facials" },
      { icon: "flask", label: "Chemical Peels" },
      { icon: "blade", label: "Dermaplaning" },
      { icon: "jar", label: "Microdermabrasion & LED" },
      { icon: "ageing", label: "Acne & Anti-Ageing" },
    ],
  },
  {
    id: "corporate",
    img: "/images/service-corporate.jpg",
    alt: "Therapist giving a seated chair massage at work",
    eyebrow: "HEALTHIER PEOPLE, STRONGER BUSINESS",
    title: "Corporate Wellness Solutions",
    body: "Customised wellness programmes to improve employee wellbeing, boost productivity and create healthier workplaces.",
    cta: "Request a proposal",
    interest: "Corporate wellness day",
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
  { img: "/images/gallery-team.jpg", alt: "Infinity Soma team at the clinic reception", caption: "Our team at Musgrave Park" },
  { img: "/images/gallery-activation.jpg", alt: "Therapist consulting visitors at a wellness stand", caption: "Community wellness activation" },
  { img: "/images/gallery-corporate-event.jpg", alt: "Outdoor corporate wellness event with treatment tents", caption: "Corporate wellness event" },
  { img: "/images/gallery-mobile.jpg", alt: "Therapist carrying a portable massage bed", caption: "Mobile treatments, wherever you are" },
];

export const interests = [
  "Wellness & massage treatment",
  "Skincare & aesthetics",
  "Corporate wellness day",
  "Occupational training",
] as const;
