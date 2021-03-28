CREATE MATERIALIZED VIEW dict.cedict_view AS
  SELECT
    "simplified",
    ARRAY["simplified"]||(array_agg(DISTINCT "entry") FILTER (WHERE "entry" IS NOT NULL AND "entry" != "simplified")) "entry",
    (array_agg(DISTINCT "reading") FILTER (WHERE "reading" IS NOT NULL))||'{}'::text[] "pinyin",
    (array_agg(DISTINCT "english") FILTER (WHERE "english" IS NOT NULL))||'{}'::text[] "english",
    (
      SELECT COUNT("entry") * length("simplified") FROM "sentence" WHERE "entry" &@ "simplified"
    ) "frequency"
  FROM (
    SELECT
      "simplified",
      unnest(ARRAY["simplified", "traditional"]) "entry",
      "reading",
      unnest("english") "english"
    FROM dict.cedict
  ) t1
  GROUP BY "simplified";

CREATE UNIQUE INDEX "idx_cedict_view_simplified" ON dict.cedict_view ("simplified");
CREATE INDEX "idx_cedict_view_entry" ON dict.cedict_view
  USING pgroonga("entry");
CREATE INDEX "idx_cedict_view_pinyin" ON dict.cedict_view
  USING pgroonga (normalize_pinyin("pinyin"));
CREATE INDEX "idx_cedict_view_english" ON dict.cedict_view
  USING pgroonga("english")
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');
CREATE INDEX "idx_cedict_view_frequency" ON dict.cedict_view ("frequency")
