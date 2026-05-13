import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedFlowStep = {
  stepKey: string;
  order: number;
  question: string;
  inputType:
    | "text"
    | "phone"
    | "email"
    | "multiple_choice"
    | "yes_no"
    | "textarea"
    | "date"
    | "zip";
  isRequired?: boolean;
  options?: { value: string; label: string }[];
  mediaType?: "none" | "image" | "video";
  mediaUrl?: string;
  thumbnailUrl?: string;
  altText?: string;
  mediaDisplayStyle?: "above" | "below" | "background";
};

type SeedClient = {
  id: string;
  name: string;
  industry: string;
  websiteUrl: string;
  widget: {
    primaryColor: string;
    accentColor: string;
    logoUrl: string;
    welcomeMessage: string;
    bubbleText: string;
  };
  notificationEmail: string;
  flow: SeedFlowStep[];
  sampleLeads?: Array<{
    name: string;
    phone: string;
    email: string;
    serviceRequested: string;
    urgency: string;
    status: string;
    sourceUrl: string;
    utmSource?: string;
    utmMedium?: string;
    answers: Record<string, string>;
  }>;
};

const clients: SeedClient[] = [
  {
    id: "ramos-james-law",
    name: "Ramos James Law",
    industry: "Legal services",
    websiteUrl: "https://ramosjameslaw.com",
    widget: {
      primaryColor: "#1e3a8a",
      accentColor: "#0f172a",
      logoUrl: "https://dummyimage.com/120x40/1e3a8a/ffffff.png&text=RJL",
      welcomeMessage:
        "Hi — tell us a bit about your case and we'll get back to you fast.",
      bubbleText: "Talk to our team",
    },
    notificationEmail: "intake@ramosjameslaw.com",
    flow: [
      {
        stepKey: "matter_type",
        order: 1,
        question: "What type of legal matter can we help with?",
        inputType: "multiple_choice",
        options: [
          { value: "personal_injury", label: "Personal injury" },
          { value: "auto_accident", label: "Auto accident" },
          { value: "trucking_accident", label: "Trucking accident" },
          { value: "workplace_injury", label: "Workplace injury" },
          { value: "other", label: "Something else" },
        ],
      },
      {
        stepKey: "incident_when",
        order: 2,
        question: "When did the incident happen?",
        inputType: "multiple_choice",
        options: [
          { value: "today", label: "Today" },
          { value: "this_week", label: "This week" },
          { value: "this_month", label: "This month" },
          { value: "earlier", label: "More than a month ago" },
        ],
      },
      {
        stepKey: "injuries",
        order: 3,
        question: "Were you or anyone involved injured?",
        inputType: "yes_no",
      },
      {
        stepKey: "summary",
        order: 4,
        question: "In a sentence or two, what happened?",
        inputType: "textarea",
      },
      {
        stepKey: "name",
        order: 5,
        question: "What's your name?",
        inputType: "text",
      },
      {
        stepKey: "phone",
        order: 6,
        question: "Best phone number to reach you?",
        inputType: "phone",
      },
      {
        stepKey: "email",
        order: 7,
        question: "And your email?",
        inputType: "email",
        isRequired: false,
      },
    ],
    sampleLeads: [
      {
        name: "Jordan Alvarez",
        phone: "512-555-0144",
        email: "jordan.alvarez@example.com",
        serviceRequested: "auto_accident",
        urgency: "today",
        status: "new",
        sourceUrl: "https://ramosjameslaw.com/auto-accidents",
        utmSource: "google",
        utmMedium: "cpc",
        answers: {
          matter_type: "auto_accident",
          incident_when: "today",
          injuries: "yes",
          summary: "Rear-ended at a stoplight on I-35 this morning.",
          name: "Jordan Alvarez",
          phone: "512-555-0144",
          email: "jordan.alvarez@example.com",
        },
      },
    ],
  },
  {
    id: "trucking-chicas",
    name: "Trucking Chicas",
    industry: "Trucking & logistics",
    websiteUrl: "https://truckingchicas.com",
    widget: {
      primaryColor: "#db2777",
      accentColor: "#9d174d",
      logoUrl:
        "https://dummyimage.com/140x40/db2777/ffffff.png&text=Trucking+Chicas",
      welcomeMessage:
        "Need a quote, dispatching, or factoring? Tell us what you need and we'll text you right back.",
      bubbleText: "Get a quote",
    },
    notificationEmail: "dispatch@truckingchicas.com",
    flow: [
      {
        stepKey: "service",
        order: 1,
        question: "What can we help you with?",
        inputType: "multiple_choice",
        options: [
          { value: "quote", label: "Get a freight quote" },
          { value: "dispatch", label: "Dispatching service" },
          { value: "factoring", label: "Factoring / quick pay" },
          { value: "compliance", label: "Compliance & DOT" },
          { value: "other", label: "Something else" },
        ],
      },
      {
        stepKey: "equipment",
        order: 2,
        question: "What kind of equipment?",
        inputType: "multiple_choice",
        options: [
          { value: "dry_van", label: "Dry van" },
          { value: "reefer", label: "Reefer" },
          { value: "flatbed", label: "Flatbed" },
          { value: "step_deck", label: "Step deck" },
          { value: "other", label: "Other" },
        ],
      },
      {
        stepKey: "origin_zip",
        order: 3,
        question: "Pickup ZIP code?",
        inputType: "zip",
      },
      {
        stepKey: "destination_zip",
        order: 4,
        question: "Delivery ZIP code?",
        inputType: "zip",
      },
      {
        stepKey: "pickup_date",
        order: 5,
        question: "When does it need to be picked up?",
        inputType: "date",
      },
      {
        stepKey: "name",
        order: 6,
        question: "Your name?",
        inputType: "text",
      },
      {
        stepKey: "phone",
        order: 7,
        question: "Best number to text or call?",
        inputType: "phone",
      },
      {
        stepKey: "email",
        order: 8,
        question: "Email for the quote?",
        inputType: "email",
        isRequired: false,
      },
    ],
    sampleLeads: [
      {
        name: "Marisol Vega",
        phone: "210-555-0173",
        email: "marisol@example.com",
        serviceRequested: "quote",
        urgency: "this_week",
        status: "new",
        sourceUrl: "https://truckingchicas.com/quote",
        utmSource: "facebook",
        utmMedium: "social",
        answers: {
          service: "quote",
          equipment: "reefer",
          origin_zip: "78201",
          destination_zip: "75201",
          pickup_date: "2026-04-29",
          name: "Marisol Vega",
          phone: "210-555-0173",
          email: "marisol@example.com",
        },
      },
    ],
  },
];

async function main() {
  for (const c of clients) {
    await prisma.client.upsert({
      where: { id: c.id },
      // Update only the top-level identity fields. Do NOT overwrite child
      // settings on update — that wipes any customization the user has done
      // through the admin (logo, colors, intro video, notifications, etc.).
      update: {
        name: c.name,
        industry: c.industry,
        websiteUrl: c.websiteUrl,
        status: "active",
        widgetSettings: { upsert: { create: c.widget, update: {} } },
        featureToggles: { upsert: { create: {}, update: {} } },
        notificationSettings: {
          upsert: {
            create: { email: c.notificationEmail },
            update: {},
          },
        },
      },
      create: {
        id: c.id,
        name: c.name,
        industry: c.industry,
        websiteUrl: c.websiteUrl,
        status: "active",
        widgetSettings: { create: c.widget },
        featureToggles: { create: {} },
        notificationSettings: { create: { email: c.notificationEmail } },
      },
    });

    // Only seed the default flow if the client has no flow steps yet, so
    // re-running the seed never wipes user-edited flows.
    const existingFlowCount = await prisma.flowStep.count({ where: { clientId: c.id } });
    if (existingFlowCount === 0) {
      for (const step of c.flow) {
        await prisma.flowStep.create({
          data: {
            clientId: c.id,
            stepKey: step.stepKey,
            order: step.order,
            question: step.question,
            inputType: step.inputType,
            isRequired: step.isRequired ?? true,
            options: step.options ?? undefined,
            mediaType: step.mediaType ?? "none",
            mediaUrl: step.mediaUrl ?? null,
            thumbnailUrl: step.thumbnailUrl ?? null,
            altText: step.altText ?? null,
            mediaDisplayStyle: step.mediaDisplayStyle ?? "above",
          },
        });
      }
    }

    const existingLeads = await prisma.lead.count({ where: { clientId: c.id } });
    if (existingLeads === 0 && c.sampleLeads?.length) {
      await prisma.lead.createMany({
        data: c.sampleLeads.map((l) => ({
          clientId: c.id,
          name: l.name,
          phone: l.phone,
          email: l.email,
          serviceRequested: l.serviceRequested,
          qualified: l.urgency, // legacy seed value mapped to renamed column
          status: l.status,
          sourceUrl: l.sourceUrl,
          utmSource: l.utmSource ?? null,
          utmMedium: l.utmMedium ?? null,
          answers: l.answers,
        })),
      });
    }

    console.log(`Seeded ${c.name} (${c.id})`);
  }

  // Drop the old demo client if it exists from a previous seed.
  await prisma.client
    .delete({ where: { id: "demo-austin-hvac" } })
    .catch(() => undefined);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
