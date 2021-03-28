CREATE MATERIALIZED VIEW "character" AS
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

CREATE UNIQUE INDEX idx_character_entry ON "character" ("entry");
CREATE INDEX idx_character_pinyin ON "character"
  USING pgroonga (normalize_pinyin("pinyin"));
CREATE INDEX idx_character_english ON "character"
  USING pgroonga ("english")
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');
CREATE INDEX idx_character_userId ON "character" ("userId");

CREATE MATERIALIZED VIEW "sentence" AS
  SELECT DISTINCT ON ("entry", "userId")
    "entry",
    "english",
    "userId",
    "isTrad"
  FROM (
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
    FROM dict.tatoeba_view
  ) t1
  ORDER BY "userId" NULLS FIRST, "entry";

CREATE UNIQUE INDEX idx_sentence_unique ON "sentence" ("entry", "userId");
CREATE INDEX idx_sentence_entry ON "sentence" 
  USING pgroonga ("entry");
CREATE INDEX idx_sentence_entry_tsvector ON "sentence"
  USING GIN (to_tsvector('jiebaqry', "entry"));
CREATE INDEX idx_sentence_english ON "sentence"
  USING pgroonga ("english")
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');
CREATE INDEX "idx_sentence_userId" ON "sentence" ("userId");
CREATE INDEX "idx_sentence_isTrad" ON "sentence" ("isTrad");

CREATE MATERIALIZED VIEW "entry_tag" AS
  SELECT
    unnest("entry") "entry",
    unnest("tag") "tag",
    "type",
    "userId"
  FROM "extra"
  UNION ALL
  SELECT
    unnest("entry") "entry",
    unnest("tag") "tag",
    "type",
    "userId"
  FROM "library"
  UNION ALL
  SELECT
    "entry",
    "tag",
    "type",
    NULL
  FROM dict.entry_tag;
  
CREATE UNIQUE INDEX "idx_entry_tag_unique" ON "entry_tag" ("entry", "tag", "type", "userId");
CREATE INDEX "idx_entry_tag_entry" ON "entry_tag" ("entry");
CREATE INDEX "idx_entry_tag_tag" ON "entry_tag"
  USING pgroonga ("tag");
CREATE INDEX "idx_entry_tag_type" ON "entry_tag" ("type");
CREATE INDEX "idx_entry_tag_userId" ON "entry_tag" ("userId");
