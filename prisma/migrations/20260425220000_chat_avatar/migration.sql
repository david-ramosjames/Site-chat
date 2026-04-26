-- Adds a separate avatar shown next to bot messages inside the chat panel,
-- distinct from the floating bubble avatar (which can be animated).
ALTER TABLE "WidgetSettings"
  ADD COLUMN "chatAvatarUrl" TEXT;
