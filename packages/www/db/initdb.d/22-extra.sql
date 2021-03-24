CREATE TABLE "extra" (
  "id"              UUID NOT NULL DEFAULT uuid_generate_v1(),
  "createdAt"       TIMESTAMPTZ DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ DEFAULT now(),
  "userId"          UUID NOT NULL,
  "type"            TEXT NOT NULL,
  "entry"           TEXT[],
  "pinyin"          TEXT[],
  "english"         TEXT[],
  "description"     TEXT,
  "tag"             TEXT[],
  PRIMARY KEY ("id"),
  CONSTRAINT
    fk_userId
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TRIGGER "t_extra_updatedAt"
  BEFORE UPDATE ON "extra"
  FOR EACH ROW
  EXECUTE PROCEDURE "f_updatedAt"();

CREATE INDEX "idx_extra_updatedAt" ON "extra" ("updatedAt");
CREATE INDEX "idx_extra_userId" ON "extra" ("userId");
CREATE INDEX "idx_extra_type" ON "extra" ("type");

CREATE INDEX "idx_extra_entry" ON "extra"
  USING pgroonga("entry");
CREATE INDEX "idx_extra_pinyin" ON "extra"
  USING pgroonga (normalize_pinyin("pinyin"));
CREATE INDEX "idx_extra_english_description" ON "extra"
  USING pgroonga(
    "english",
    "description"
  )
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');
CREATE INDEX "idx_extra_tag" ON "extra" USING gin ("tag");
