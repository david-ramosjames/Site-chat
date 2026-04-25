import { z } from "zod";

export const widgetSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Use a hex color like #2563eb"),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Use a hex color like #1d4ed8"),
  logoUrl: z.string().url().or(z.literal("")).optional().nullable(),
  welcomeMessage: z.string().min(1).max(280),
  bubbleText: z.string().min(1).max(80),
  widgetPosition: z.enum(["bottom-right", "bottom-left"]),
  isActive: z.boolean(),
  businessName: z.string().min(1).max(120),
  industry: z.string().min(1).max(80),
});

export const featureTogglesSchema = z.object({
  showProgress: z.boolean(),
  allowFileUpload: z.boolean(),
  collectUtm: z.boolean(),
  collectPageUrl: z.boolean(),
  collectReferrer: z.boolean(),
  enableAiSummary: z.boolean(),
  enableLeadScoring: z.boolean(),
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
  nextLogic: z.any().optional().nullable(),
  mediaType: z.enum(["none", "image", "video"]).default("none"),
  mediaUrl: z.string().url().or(z.literal("")).optional().nullable(),
  thumbnailUrl: z.string().url().or(z.literal("")).optional().nullable(),
  altText: z.string().max(200).optional().nullable(),
  mediaDisplayStyle: z.enum(["above", "below", "background"]).default("above"),
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
    })
    .optional()
    .nullable(),
  userAgent: z.string().optional().nullable(),
});

export const createClientSchema = z.object({
  name: z.string().min(1).max(120),
  industry: z.string().min(1).max(80),
  websiteUrl: z.string().url(),
});
