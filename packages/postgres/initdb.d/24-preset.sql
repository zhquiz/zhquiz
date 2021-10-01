CREATE TABLE "quiz_preset" (
    "id"              UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    "createdAt"       TIMESTAMPTZ DEFAULT now(),
    "updatedAt"       TIMESTAMPTZ DEFAULT now(),
    "userId"          UUID NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "name"            TEXT NOT NULL,
    "settings"        JSONB NOT NULL
);

CREATE TRIGGER "t_quiz_preset_updatedAt"
    BEFORE UPDATE ON "quiz_preset"
    FOR EACH ROW
    EXECUTE PROCEDURE "f_updatedAt"();

CREATE INDEX "idx_quiz_preset_updatedAt" ON "quiz_preset" ("updatedAt");
CREATE INDEX "idx_quiz_preset_userId" ON "quiz_preset" ("userId");
CREATE INDEX "idx_quiz_preset_name" ON "quiz_preset"
    USING pgroonga ("name");
