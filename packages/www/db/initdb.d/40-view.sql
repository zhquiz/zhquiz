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

=
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

CREATE VIEW "entry_tag" AS
  SELECT
    unnest("entry") "entry",
    unnest("tag") "tag",
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
