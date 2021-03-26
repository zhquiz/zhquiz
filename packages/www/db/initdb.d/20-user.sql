CREATE TABLE "user" (
  "id"                        UUID NOT NULL DEFAULT (uuid_generate_v4()),
  "createdAt"                 TIMESTAMPTZ DEFAULT now(),
  "updatedAt"                 TIMESTAMPTZ DEFAULT now(),
  "identifier"                TEXT NOT NULL,
  "sentence.length.min"       INT,
  "sentence.length.max"       INT,
  "level.min"                 INT,
  "level.max"                 INT,
  "level.vocabulary.showing"  TEXT[],
  "quiz.settings"             JSONB
  PRIMARY KEY ("id")
);

CREATE TRIGGER "t_user_updatedAt"
  BEFORE UPDATE ON "user"
  FOR EACH ROW
  EXECUTE PROCEDURE "f_updatedAt"();

CREATE INDEX "idx_user_updatedAt" ON "user" ("updatedAt");
