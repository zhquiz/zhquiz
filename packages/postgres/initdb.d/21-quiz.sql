CREATE TABLE "quiz" (
    "id"              UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    "createdAt"       TIMESTAMPTZ DEFAULT now(),
    "updatedAt"       TIMESTAMPTZ DEFAULT now(),
    "userId"          UUID NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "entry"           TEXT NOT NULL,
    "type"            TEXT NOT NULL,
    "direction"       TEXT NOT NULL,
    "hint"            TEXT NOT NULL DEFAULT '',
    "mnemonic"        TEXT NOT NULL DEFAULT '',
    "srsLevel"        INT,
    "nextReview"      TIMESTAMPTZ,
    "lastRight"       TIMESTAMPTZ,
    "lastWrong"       TIMESTAMPTZ,
    "maxRight"        INT,
    "maxWrong"        INT,
    "rightStreak"     INT,
    "wrongStreak"     INT
);

CREATE TRIGGER "t_quiz_updatedAt"
    BEFORE UPDATE ON "quiz"
    FOR EACH ROW
    EXECUTE PROCEDURE "f_updatedAt"();

CREATE UNIQUE INDEX "idx_u_quiz" ON "quiz" ("userId", "entry", "type", "direction");

CREATE INDEX "idx_quiz_q" ON "quiz"
    USING pgroonga ("hint", "mnemonic")
    WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');

CREATE INDEX "idx_quiz_entry" ON "quiz" ("entry");
CREATE INDEX "idx_quiz_updatedAt" ON "quiz" ("updatedAt");
CREATE INDEX "idx_quiz_userId" ON "quiz" ("userId");
CREATE INDEX "idx_quiz_srsLevel" ON "quiz" ("srsLevel");
CREATE INDEX "idx_quiz_nextReview" ON "quiz" ("nextReview");
CREATE INDEX "idx_quiz_lastRight" ON "quiz" ("lastRight");
CREATE INDEX "idx_quiz_lastWrong" ON "quiz" ("lastWrong");
CREATE INDEX "idx_quiz_maxRight" ON "quiz" ("maxRight");
CREATE INDEX "idx_quiz_maxWrong" ON "quiz" ("maxWrong");
CREATE INDEX "idx_quiz_rightStreak" ON "quiz" ("rightStreak");
CREATE INDEX "idx_quiz_wrongStreak" ON "quiz" ("wrongStreak");
