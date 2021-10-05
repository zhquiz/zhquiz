CREATE TABLE "entry" (
    "id"            UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    "createdAt"     TIMESTAMPTZ DEFAULT now(),
    "updatedAt"     TIMESTAMPTZ DEFAULT now(),
    "userId"        UUID NOT NULL DEFAULT uuid_nil() REFERENCES "user"("id") ON DELETE CASCADE,
    "type"          TEXT NOT NULL,
    "entry"         TEXT[] NOT NULL CHECK ("entry"[1] IS NOT NULL),
    "reading"       TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    "translation"   TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    "description"   TEXT NOT NULL DEFAULT '',
    "tag"           TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    "level"         FLOAT NOT NULL,
    "hLevel"        INT NOT NULL,
    "frequency"     FLOAT
);

CREATE TRIGGER "t_entry_updatedAt"
    BEFORE UPDATE ON "entry"
    FOR EACH ROW
    EXECUTE PROCEDURE "f_updatedAt"();

CREATE UNIQUE INDEX idx_entry_u ON "entry" (("entry"[1]), "type", "userId");

CREATE INDEX "idx_entry_updatedAt" ON "entry" ("updatedAt");
CREATE INDEX "idx_entry_userId" ON "entry" ("userId");
CREATE INDEX "idx_entry_type" ON "entry" ("type");
CREATE INDEX "idx_entry_level" ON "entry" ("level");
CREATE INDEX "idx_entry_hLevel" ON "entry" ("hLevel");
CREATE INDEX "idx_entry_frequency" ON "entry" ("frequency");

CREATE INDEX "idx_entry_pinyin" ON "entry"
    USING pgroonga (normalize_pinyin("reading"));
CREATE INDEX "idx_entry_translation_description" ON "entry"
    USING pgroonga(
        "translation",
        "description"
    )
    WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');

CREATE INDEX "idx_entry_entry" ON "entry" USING pgroonga("entry");
CREATE INDEX "idx_entry_entry_gin" ON "entry" USING GIN("entry");
CREATE INDEX "idx_entry_tag" ON "entry" USING pgroonga ("tag");
