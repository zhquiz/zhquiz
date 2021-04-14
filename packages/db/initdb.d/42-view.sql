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
  FROM cedict_view;

CREATE MATERIALIZED VIEW "level" AS
  SELECT
    "entry",
    max("hLevel") "hLevel",
    max("vLevel") "vLevel"
  FROM (
    SELECT "entry", "hLevel", "vLevel"
    FROM dict.zhlevel
    UNION
    SELECT "entry"[1] "entry", "f_hLevel"("entry"[1]) "hLevel", NULL "vLevel"
    FROM "vocabulary"
    WHERE "userId" IS NULL
    UNION
    SELECT "entry", "f_hLevel"("entry") "hLevel", "f_vLevel"("entry") "vLevel"
    FROM "sentence"
    WHERE "userId" IS NULL
  ) t1
  GROUP BY "entry";

CREATE UNIQUE INDEX "idx_level_entry" ON "level" ("entry");
CREATE INDEX "idx_level_hLevel" ON "level" ("hLevel");
CREATE INDEX "idx_level_vLevel" ON "level" ("vLevel");
