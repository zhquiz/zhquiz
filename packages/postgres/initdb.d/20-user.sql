CREATE TABLE "user" (
    "id"                        UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    "createdAt"                 TIMESTAMPTZ DEFAULT now(),
    "updatedAt"                 TIMESTAMPTZ DEFAULT now(),
    "identifier"                TEXT UNIQUE NOT NULL,
    "sentence.length.min"       INT,
    "sentence.length.max"       INT,
    "level.min"                 INT DEFAULT 1,
    "level.max"                 INT DEFAULT 10,
    "level.vocabulary.showing"  TEXT[],
    "quiz.settings"             JSONB
);

CREATE TRIGGER "t_user_updatedAt"
    BEFORE UPDATE ON "user"
    FOR EACH ROW
    EXECUTE PROCEDURE "f_updatedAt"();

CREATE INDEX "idx_user_updatedAt" ON "user" ("updatedAt");
CREATE INDEX "idx_user_identifier" ON "user" ("identifier");

INSERT INTO "user" ("id", "identifier") VALUES (uuid_nil(), '');
