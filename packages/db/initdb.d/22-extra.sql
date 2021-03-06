CREATE TABLE "extra" (
  "id"              UUID NOT NULL DEFAULT uuid_generate_v4(),
  "createdAt"       TIMESTAMPTZ DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ DEFAULT now(),
  "userId"          UUID NOT NULL,
  "type"            TEXT NOT NULL,
  "entry"           TEXT[] NOT NULL CHECK ("entry"[1] IS NOT NULL),
  "pinyin"          TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  "english"         TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  "description"     TEXT NOT NULL DEFAULT '',
  "tag"             TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  PRIMARY KEY ("id"),
  CONSTRAINT
    fk_userId
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TRIGGER "t_extra_updatedAt"
  BEFORE UPDATE ON "extra"
  FOR EACH ROW
  EXECUTE PROCEDURE "f_updatedAt"();

CREATE UNIQUE INDEX idx_extra_u ON extra (("entry"[1]), "type");

CREATE INDEX "idx_extra_updatedAt" ON "extra" ("updatedAt");
CREATE INDEX "idx_extra_userId" ON "extra" ("userId");
CREATE INDEX "idx_extra_type" ON "extra" ("type");

CREATE INDEX "idx_extra_pinyin" ON "extra"
  USING pgroonga (normalize_pinyin("pinyin"));
CREATE INDEX "idx_extra_english_description" ON "extra"
  USING pgroonga(
    "english",
    "description"
  )
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');

CREATE INDEX "idx_extra_entry" ON "extra" USING pgroonga("entry");
CREATE INDEX "idx_extra_entry_gin" ON "extra" USING GIN("entry");

CREATE INDEX "idx_extra_tag" ON "extra" USING pgroonga ("tag");
