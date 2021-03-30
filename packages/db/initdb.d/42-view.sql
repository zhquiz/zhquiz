CREATE VIEW "vocabulary" AS
  SELECT
    "entry",
    "pinyin",
    "english",
    "userId",
    NULL "frequency"
  FROM "extra"
  WHERE "type" = 'vocabulary'
  UNION ALL
  SELECT
    "entry",
    "pinyin",
    "english",
    NULL "userId",
    "frequency"
  FROM dict.cedict_view;
