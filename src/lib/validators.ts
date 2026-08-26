import { z } from "zod";

const optionalUrl = z.string().url().or(z.literal("")).optional().nullable();
const optionalHexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Use a hex color like #2563eb")
  .or(z.literal(""))
  .optional()
  .nullable();

export const widgetSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Use a hex color like #2563eb"),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Use a hex color like #1d4ed8"),
  logoUrl: optionalUrl,
  welcomeMessage: z.string().min(1).max(280),
  bubbleText: z.string().min(1).max(80),
  widgetPosition: z.enum(["bottom-right", "bottom-left"]),
  isActive: z.boolean(),
  businessName: z.string().min(1).max(120),
  industry: z.string().min(1).max(80),

  introVideoEnabled: z.boolean().default(false)
,
  introVideoUrl: optionalUrl,
  introPosterUrl: optionalUrl,
  introVideoEndImageUrl: optionalUrl,
  introVideoUrlEs: optionalUrl,
  introPosterUrlEs: optionalUrl,
  introVideoEndImageUrlEs: optionalUrl,
  introVideoStyle: z.enum(["top", "background"]).default("top"),

  bubbleImageUrl: optionalUrl,
  bubbleTooltip: z.string().max(200).optional().nullable(),
  bubbleTooltipBgColor: optionalHexColor,
  bubbleTooltipTextColor: optionalHexColor,

  chatAvatarUrl: optionalUrl,

  enableTranslation: z.boolean().default(true),
  translations: z
    .object({
      es: z
        .object({
          welcomeMessage: z.string().max(280).optional().nullable(),
          bubbleText: z.string().max(80).optional().nullable(),
          bubbleTooltip: z.string().max(200).optional().nullable(),
          secondWelcomeMessage: z.string().max(280).optional().nullable(),
          declineHeadline: z.string().max(120).optional().nullable(),
          declineMessage: z.string().max(500).optional().nullable(),
          successHeadline: z.string().max(120).optional().nullable(),
          successMessage: z.string().max(500).optional().nullable(),
        })
        .optional(),
    })
    .optional()
    .nullable(),

  declineHeadline: z.string().max(120).optional().nullable(),
  declineMessage: z.string().max(500).optional().nullable(),
  successHeadline: z.string().max(120).optional().nullable(),
  successMessage: z.string().max(500).optional().nullable(),
  googleAdsConversionId: z.string().max(60).optional().nullable(),
  googleAdsConversionLabel: z.string().max(60).optional().nullable(),

  headerSubtitle: z.string().max(200).optional().nullable(),
  headerSubtitleEs: z.string().max(200).optional().nullable(),
  showVideoControls: z.boolean().default(false),
  introVideoStartMuted: z.boolean().default(true),
  headerButtonColor: optionalHexColor,

  callRailUseDynamicNumber: z.boolean().default(false),
  callRailSwapWaitMs: z.number().int().min(0).max(5000).default(800),
  callRailDynamicNumberSelector: z.string().max(200).optional().nullable(),
  defaultPhoneCountry: z.enum(["US", "MX"]).default("US"),

  secondWelcomeMessage: z.string().max(280).optional().nullable(),
  secondWelcomeDelaySec: z.number().int().min(5).max(600).default(30),
  secondWelcomeBgColor: optionalHexColor,
  secondWelcomeTextColor: optionalHexColor,

  brandingFooterEnabled: z.boolean().default(true),
  brandingFooterText: z.string().max(120).optional().nullable(),

  sideButtons: z
    .array(
      z.object({
        type: z.enum(["phone", "sms", "messenger", "whatsapp", "custom"]),
        label: z.string().max(40).optional().nullable(),
        destination: z.string().min(1).max(500),
        showOnDesktop: z.boolean(),
        showOnMobile: z.boolean(),
        showInEnglish: z.boolean(),
        showInSpanish: z.boolean(),
      })
    )
    .max(10)
    .optional()
    .nullable(),
  sideButtonsPosition: z.enum(["bottom", "center"]).default("bottom"),

  endCtas: z
    .array(
      z.object({
        type: z.enum(["call", "text", "schedule", "link"]),
        label: z.string().min(1).max(60),
        labelEs: z.string().max(60).optional().nullable(),
        destination: z.string().min(1).max(500),
      })
    )
    .max(5)
    .optional()
    .nullable(),

  declineCtas: z
    .array(
      z.object({
        type: z.enum(["call", "text", "schedule", "link"]),
        label: z.string().min(1).max(60),
        labelEs: z.string().max(60).optional().nullable(),
        destination: z.string().min(1).max(500),
      })
    )
    .max(5)
    .optional()
    .nullable(),

  openOnLoad: z.boolean().default(false),
});

export const endCtasUpdateSchema = z.object({
  endCtas: z
    .array(
      z.object({
        type: z.enum(["call", "text", "schedule", "link"]),
        label: z.string().min(1).max(60),
        labelEs: z.string().max(60).optional().nullable(),
        destination: z.string().min(1).max(500),
      })
    )
    .max(5),
  successHeadline: z.string().max(120).optional().nullable(),
  successMessage: z.string().max(500).optional().nullable(),
  translations: z
    .object({
      es: z
        .object({
          successHeadline: z.string().max(120).optional().nullable(),
          successMessage: z.string().max(500).optional().nullable(),
        })
        .optional(),
    })
    .optional()
    .nullable(),
});

export const declineUpdateSchema = z.object({
  declineHeadline: z.string().max(120).optional().nullable(),
  declineMessage: z.string().max(500).optional().nullable(),
  declineCtas: z
    .array(
      z.object({
        type: z.enum(["call", "text", "schedule", "link"]),
        label: z.string().min(1).max(60),
        labelEs: z.string().max(60).optional().nullable(),
        destination: z.string().min(1).max(500),
      })
    )
    .max(5)
    .optional()
    .nullable(),
  translations: z
    .object({
      es: z
        .object({
          declineHeadline: z.string().max(120).optional().nullable(),
          declineMessage: z.string().max(500).optional().nullable(),
        })
        .optional(),
    })
    .optional()
    .nullable(),
});

export const featureTogglesSchema = z.object({
  showProgress: z.boolean(),
  allowFileUpload: z.boolean(),
  collectUtm: z.boolean(),
  collectPageUrl: z.boolean(),
  collectReferrer: z.boolean(),
  enableAiSummary: z.boolean(),
  enableLeadScoring: z.boolean(),
  llmProvider: z.enum(["openai", "anthropic", "custom"]).default("openai"),
  llmModel: z.string().min(1).max(120).default("gpt-4o-mini"),
  llmApiKey: z.string().max(500).optional().nullable(),
  enableAfterHours: z.boolean(),
  enableSmsAlerts: z.boolean(),
  enableEmailAlerts: z.boolean(),
  enableSlackAlerts: z.boolean(),
  enableGoogleSheetSync: z.boolean(),
  enableCrmWebhook: z.boolean(),
  enableMedia: z.boolean(),
  enableFallbackForm: z.boolean(),
  enableSpamProtection: z.boolean(),
});

export const notificationSettingsSchema = z.object({
  email: z.string().email().or(z.literal("")).optional().nullable(),
  phone: z.string().max(40).or(z.literal("")).optional().nullable(),
  slackWebhookUrl: z.string().url().or(z.literal("")).optional().nullable(),
  crmWebhookUrl: z.string().url().or(z.literal("")).optional().nullable(),
  googleSheetWebhookUrl: z.string().url().or(z.literal("")).optional().nullable(),
  callRailAccountId: z.string().max(60).optional().nullable(),
  callRailCompanyId: z.string().max(60).optional().nullable(),
  callRailApiKey: z.string().max(200).optional().nullable(),
  callRailFormId: z.string().max(60).optional().nullable(),
  slackHeaderPriorityReferral: z.string().max(200).optional().nullable(),
  slackHeaderPriority: z.string().max(200).optional().nullable(),
  slackHeaderReferral: z.string().max(200).optional().nullable(),
  slackHeaderDefault: z.string().max(200).optional().nullable(),
  slackPostPriorityReferral: z.boolean().default(true),
  slackPostPriority: z.boolean().default(true),
  slackPostReferral: z.boolean().default(true),
  slackPostDefault: z.boolean().default(true),
});

export const flowStepInputSchema = z.object({
  stepKey: z.string().min(1).max(64).regex(/^[a-z0-9_\-]+$/i, "Letters, numbers, dash, underscore only"),
  order: z.number().int().min(0),
  question: z.string().min(1).max(500),
  inputType: z.enum([
    "text",
    "phone",
    "email",
    "multiple_choice",
    "yes_no",
    "textarea",
    "date",
    "zip",
  ]),
  isRequired: z.boolean().default(true),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional()
    .nullable(),
  nextLogic: z
    .object({
      // For multiple_choice / yes_no: map option value -> target stepKey
      // (or the literal "__end" to finish the flow early).
      byOption: z.record(z.string()).optional().nullable(),
      // Optional fallback when no byOption rule matches the chosen value.
      default: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  mediaType: z.enum(["none", "image", "video"]).default("none"),
  mediaUrl: z.string().url().or(z.literal("")).optional().nullable(),
  thumbnailUrl: z.string().url().or(z.literal("")).optional().nullable(),
  altText: z.string().max(200).optional().nullable(),
  mediaDisplayStyle: z.enum(["above", "below", "background"]).default("above"),
  leadField: z
    .enum(["name", "phone", "email", "service", "qualified", "referral"])
    .optional()
    .nullable(),
  leadFieldOnYes: z.string().max(60).optional().nullable(),
  leadFieldOnNo: z.string().max(60).optional().nullable(),
  leadFieldByOption: z.record(z.string().max(60)).optional().nullable(),
  translations: z
    .object({
      es: z
        .object({
          question: z.string().max(500).optional().nullable(),
          options: z
            .array(z.object({ value: z.string(), label: z.string() }))
            .optional()
            .nullable(),
        })
        .optional(),
    })
    .optional()
    .nullable(),
});

export const flowUpdateSchema = z.object({
  steps: z.array(flowStepInputSchema),
});

export const leadSubmissionSchema = z.object({
  clientId: z.string().min(1),
  answers: z.record(z.any()),
  transcript: z
    .array(
      z.object({
        role: z.enum(["bot", "user"]),
        text: z.string(),
        stepKey: z.string().optional(),
      })
    )
    .default([]),
  sourceUrl: z.string().url().optional().nullable(),
  referrer: z.string().optional().nullable(),
  utm: z
    .object({
      source: z.string().optional().nullable(),
      medium: z.string().optional().nullable(),
      campaign: z.string().optional().nullable(),
      term: z.string().optional().nullable(),
      content: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  gclid: z.string().max(500).optional().nullable(),
  msclkid: z.string().max(500).optional().nullable(),
  fbclid: z.string().max(500).optional().nullable(),
  ttclid: z.string().max(500).optional().nullable(),
  wbraid: z.string().max(500).optional().nullable(),
  gbraid: z.string().max(500).optional().nullable(),
  ndclid: z.string().max(500).optional().nullable(),
  landingPageUrl: z.string().url().optional().nullable(),
  callrailSessionId: z.string().max(200).optional().nullable(),
  chatSessionId: z.string().max(80).optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const chatEventSchema = z.object({
  clientId: z.string().min(1),
  sessionId: z.string().min(1).max(80),
  type: z.enum(["opened", "started", "completed_success", "completed_decline", "cta_click"]),
  source: z.enum(["auto", "click", "call", "text", "schedule", "link"]).optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  referrer: z.string().optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
});

export const createClientSchema = z.object({
  name: z.string().min(1).max(120),
  industry: z.string().min(1).max(80),
  websiteUrl: z.string().url(),
});
