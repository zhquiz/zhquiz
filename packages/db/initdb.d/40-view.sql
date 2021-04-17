CREATE VIEW "entries" AS
  SELECT
    "entry",
    "pinyin",
    "english",
    "userId",
    "type"
  FROM "extra"
  UNION ALL
  SELECT
    "entry",
    "pinyin",
    "english",
    NULL,
    "type"
  FROM (
    SELECT
      "entry",
      "pinyin",
      "english",
      "type"
    FROM dict.entries
    ORDER BY "frequency" DESC NULLS LAST
  ) t1;

CREATE VIEW "tag" AS
  SELECT
    "tag",
    "type",
    "userId",
    "entry"
  FROM "extra"
  UNION
  SELECT
    "tag",
    "type",
    "userId",
    "entry"
  FROM "library"
  UNION
  SELECT
    "tag",
    "type",
    NULL "userId",
    "entry"
  FROM dict.entries;
