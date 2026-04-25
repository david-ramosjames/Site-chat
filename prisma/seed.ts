import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clientId = "demo-austin-hvac";

  await prisma.client.upsert({
    where: { id: clientId },
    update: {},
    create: {
      id: clientId,
      name: "Austin HVAC Pros",
      industry: "HVAC",
      websiteUrl: "https://example-austin-hvac.com",
      status: "active",
      widgetSettings: {
        create: {
          primaryColor: "#0ea5e9",
          accentColor: "#0369a1",
          logoUrl: "https://dummyimage.com/120x40/0ea5e9/ffffff.png&text=Austin+HVAC",
          welcomeMessage: "Need help with your AC or heating? We answer fast.",
          bubbleText: "Get a fast quote",
          widgetPosition: "bottom-right",
          isActive: true,
        },
      },
      featureToggles: {
        create: {
          showProgress: true,
          collectUtm: true,
          collectPageUrl: true,
          collectReferrer: true,
          enableEmailAlerts: true,
          enableMedia: true,
          enableFallbackForm: true,
          enableSpamProtection: true,
        },
      },
      notificationSettings: {
        create: {
          email: "leads@example-austin-hvac.com",
        },
      },
    },
  });

  // Clear and recreate flow steps so seed is deterministic
  await prisma.flowStep.deleteMany({ where: { clientId } });

  const steps = [
    {
      stepKey: "service",
      order: 1,
      question: "What service do you need?",
      inputType: "multiple_choice",
      isRequired: true,
      options: [
        { value: "ac_repair", label: "AC repair" },
        { value: "heating_repair", label: "Heating repair" },
        { value: "maintenance", label: "Maintenance" },
        { value: "new_install", label: "New installation" },
        { value: "other", label: "Other" },
      ],
      mediaType: "image",
      mediaUrl:
        "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=800&q=70",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=200&q=60",
      altText: "HVAC technician servicing an air conditioner",
      mediaDisplayStyle: "above",
    },
    {
      stepKey: "urgency",
      order: 2,
      question: "Is this urgent?",
      inputType: "multiple_choice",
      isRequired: true,
      options: [
        { value: "today", label: "Yes, today" },
        { value: "few_days", label: "Within a few days" },
        { value: "researching", label: "Just researching" },
      ],
    },
    {
      stepKey: "zip",
      order: 3,
      question: "What ZIP code is the service location?",
      inputType: "zip",
      isRequired: true,
    },
    {
      stepKey: "name",
      order: 4,
      question: "What is your name?",
      inputType: "text",
      isRequired: true,
    },
    {
      stepKey: "phone",
      order: 5,
      question: "What is the best phone number?",
      inputType: "phone",
      isRequired: true,
      mediaType: "video",
      mediaUrl: "https://www.youtube.com/embed/ScMzIvxBSi4",
      thumbnailUrl: "https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg",
      altText: "30-second intro video from Austin HVAC Pros",
      mediaDisplayStyle: "above",
    },
    {
      stepKey: "email",
      order: 6,
      question: "What is your email?",
      inputType: "email",
      isRequired: true,
    },
    {
      stepKey: "notes",
      order: 7,
      question: "Anything else we should know?",
      inputType: "textarea",
      isRequired: false,
    },
  ];

  for (const step of steps) {
    await prisma.flowStep.create({
      data: {
        clientId,
        ...step,
        options: step.options ?? undefined,
      },
    });
  }

  // A couple of sample leads so the dashboard is not empty on first load.
  const existingLeads = await prisma.lead.count({ where: { clientId } });
  if (existingLeads === 0) {
    await prisma.lead.createMany({
      data: [
        {
          clientId,
          name: "Maria Gomez",
          phone: "512-555-0142",
          email: "maria@example.com",
          serviceRequested: "AC repair",
          urgency: "today",
          status: "new",
          sourceUrl: "https://example-austin-hvac.com/services/ac-repair",
          utmSource: "google",
          utmMedium: "cpc",
          utmCampaign: "summer-ac",
          answers: {
            service: "ac_repair",
            urgency: "today",
            zip: "78704",
            name: "Maria Gomez",
            phone: "512-555-0142",
            email: "maria@example.com",
            notes: "AC not cooling since last night.",
          },
        },
        {
          clientId,
          name: "Derrick Lee",
          phone: "512-555-0198",
          email: "derrick@example.com",
          serviceRequested: "Maintenance",
          urgency: "few_days",
          status: "contacted",
          sourceUrl: "https://example-austin-hvac.com/",
          utmSource: "facebook",
          utmMedium: "social",
          answers: {
            service: "maintenance",
            urgency: "few_days",
            zip: "78745",
            name: "Derrick Lee",
            phone: "512-555-0198",
            email: "derrick@example.com",
          },
        },
      ],
    });
  }

  console.log("Seeded demo client:", clientId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
