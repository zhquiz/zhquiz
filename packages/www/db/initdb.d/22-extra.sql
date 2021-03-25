CREATE TABLE "extra" (
  "id"              UUID NOT NULL DEFAULT uuid_generate_v1(),
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

CREATE MATERIALIZED VIEW "character" AS
  SELECT
    unnest("entry") "character",
    "pinyin",
    "english",
    "userId"
  FROM "extra"
  WHERE "type" = 'character'
  UNION ALL
  SELECT
    "character",
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

CREATE INDEX "idx_character_userId" ON "character" ("userId");
CREATE INDEX "idx_character_character" ON "character" ("character");
CREATE INDEX "idx_character_pinyin" ON "character"
  USING pgroonga (normalize_pinyin("pinyin"));
CREATE INDEX "idx_character_english" ON "character"
  USING pgroonga("english")
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');

CREATE MATERIALIZED VIEW "vocabulary" AS
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
  FROM (
    SELECT
      ARRAY["simplified"]||(array_agg(DISTINCT "entry") FILTER (WHERE "entry" IS NOT NULL AND "entry" != "simplified")) "entry",
      (array_agg(DISTINCT "reading") FILTER (WHERE "reading" IS NOT NULL))||'{}'::text[] "pinyin",
      (array_agg(DISTINCT "english") FILTER (WHERE "english" IS NOT NULL))||'{}'::text[] "english"
    FROM (
      SELECT
        "simplified",
        unnest(ARRAY["simplified", "traditional"]) "entry",
        "reading",
        unnest("english") "english",
        "frequency"
      FROM dict.cedict
    ) t1
    GROUP BY "simplified"
    ORDER BY max("frequency") DESC NULLS LAST
  ) t2;

CREATE INDEX "idx_vocabulary_userId" ON "vocabulary" ("userId");
CREATE INDEX "idx_vocabulary_entry" ON "vocabulary"
  USING pgroonga("entry");
CREATE INDEX "idx_vocabulary_pinyin" ON "vocabulary"
  USING pgroonga (normalize_pinyin("pinyin"));
CREATE INDEX "idx_vocabulary_english" ON "vocabulary"
  USING pgroonga("english")
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');

CREATE MATERIALIZED VIEW "entry_tag" AS
  SELECT DISTINCT
    "entry", "tag", "type", "userId"
  FROM (
    SELECT
      unnest("entry") "entry",
      unnest("tag") "tag",
      "type",
      "userId"
    FROM "extra"
    UNION ALL
    SELECT "entry", 'HSK', 'vocabulary', NULL
    FROM dict.zhlevel WHERE "vLevel" IS NOT NULL
    UNION ALL
    SELECT "entry", (CASE
      WHEN "vLevel" <= 5 THEN 'HSK1'
      WHEN "vLevel" <= 10 THEN 'HSK2'
      WHEN "vLevel" <= 20 THEN 'HSK3'
      WHEN "vLevel" <= 30 THEN 'HSK4'
      WHEN "vLevel" <= 40 THEN 'HSK5'
      ELSE 'HSK6'
    END), 'vocabulary', NULL
    FROM dict.zhlevel WHERE "vLevel" IS NOT NULL
  ) t1
  ORDER BY "entry";

CREATE INDEX "idx_et_entry" ON "entry_tag" ("entry");
CREATE INDEX "idx_et_tag" ON "entry_tag" USING pgroonga("tag")
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');
CREATE INDEX "idx_et_type" ON "entry_tag" ("type");
CREATE INDEX "idx_et_userId" ON "entry_tag" ("userId");
