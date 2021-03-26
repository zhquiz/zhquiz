CREATE TABLE "extra" (
  "id"              UUID NOT NULL DEFAULT uuid_generate_v4(),
  "createdAt"       TIMESTAMPTZ DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ DEFAULT now(),
  "userId"          UUID,
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

CREATE INDEX "idx_extra_pinyin" ON "extra"
  USING pgroonga (normalize_pinyin("pinyin"));
CREATE INDEX "idx_extra_english_description" ON "extra"
  USING pgroonga(
    "english",
    "description"
  )
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');

CREATE INDEX "idx_extra_entry" ON "extra" USING pgroonga("entry");
CREATE INDEX "idx_extra_tag" ON "extra" USING pgroonga ("tag");

CREATE VIEW "character" AS
  SELECT
    unnest("entry") "entry",
    "pinyin",
    "english",
    "userId"
  FROM "extra"
  WHERE "type" = 'character'
  UNION ALL
  SELECT
    "character" "entry",
    "pinyin",
    "english",
    NULL
  FROM (
    SELECT
      "character",
      "pinyin",
      "english"
    FROM dict.junda
    ORDER BY "frequency" DESC NULLS LAST
  ) t1;

CREATE VIEW "vocabulary" AS
  SELECT
    "entry",
    "pinyin",
    "english",
    "userId"
  FROM "extra"
  WHERE "type" = 'vocabulary'
  UNION ALL
  SELECT
    "entry",
    "pinyin",
    "english",
    NULL "userId"
  FROM dict.cedict_view;

CREATE VIEW "sentence" AS
  SELECT
    unnest("entry") "entry",
    "english",
    "userId",
    NULL::BOOLEAN "isTrad"
  FROM "extra"
  WHERE "type" = 'sentence'
  UNION ALL
  SELECT
    "chinese" "entry",
    ARRAY["english"] "english",
    NULL,
    NULL
  FROM online.jukuu
  UNION ALL
  SELECT
    "cmn" "entry",
    ARRAY["eng"] "english",
    NULL,
    "isTrad"
  FROM dict.tatoeba_view;

CREATE MATERIALIZED VIEW dict.entry_tag AS
  SELECT
    ARRAY["entry"] "entry",
    ARRAY['HSK', (CASE
      WHEN "vLevel" <= 5 THEN 'HSK1'
      WHEN "vLevel" <= 10 THEN 'HSK2'
      WHEN "vLevel" <= 20 THEN 'HSK3'
      WHEN "vLevel" <= 30 THEN 'HSK4'
      WHEN "vLevel" <= 40 THEN 'HSK5'
      ELSE 'HSK6'
    END)] "tag",
    'vocabulary' "type"
  FROM dict.zhlevel WHERE "vLevel" IS NOT NULL
  UNION ALL
  SELECT
    ARRAY["entry"] "entry",
    ARRAY['HSK', (CASE
      WHEN "vLevel" <= 5 THEN 'HSK1'
      WHEN "vLevel" <= 10 THEN 'HSK2'
      WHEN "vLevel" <= 20 THEN 'HSK3'
      WHEN "vLevel" <= 30 THEN 'HSK4'
      WHEN "vLevel" <= 40 THEN 'HSK5'
      ELSE 'HSK6'
    END)] "tag",
    'character' "type"
  FROM dict.zhlevel WHERE length("entry") = 1 AND "vLevel" IS NOT NULL;

CREATE INDEX "idx_entry_tag_entry" ON dict.entry_tag USING pgroonga("entry");
CREATE INDEX "idx_entry_tag_tag" ON dict.entry_tag USING pgroonga ("tag");

CREATE VIEW "entry_tag" AS
  SELECT
    "entry",
    "tag",
    "type",
    "userId"
  FROM "extra"
  UNION ALL
  SELECT
    "entry",
    "tag",
    "type",
    NULL
  FROM dict.entry_tag;
