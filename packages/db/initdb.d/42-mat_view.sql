CREATE MATERIALIZED VIEW "level" AS
  SELECT
    "entry",
    max("hLevel") "hLevel",
    max("vLevel") "vLevel"
  FROM (
    SELECT "entry", "hLevel", "vLevel"
    FROM dict.zhlevel
    UNION
    SELECT unnest("entry") "entry", "f_hLevel"("entry"[1]) "hLevel", NULL "vLevel"
    FROM dict.entries
    WHERE "type" = 'vocabulary'
    UNION
    SELECT "entry"[1], "f_hLevel"("entry"[1]) "hLevel", "f_vLevel"("entry"[1]) "vLevel"
    FROM dict.entries
    WHERE "type" = 'sentence'
  ) t1
  GROUP BY "entry";

CREATE UNIQUE INDEX "idx_level_entry" ON "level" ("entry");
CREATE INDEX "idx_level_hLevel" ON "level" ("hLevel");
CREATE INDEX "idx_level_vLevel" ON "level" ("vLevel");
