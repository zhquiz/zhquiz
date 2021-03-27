CREATE TABLE dict.cedict (
  "id"              INT GENERATED ALWAYS AS IDENTITY,
  "simplified"      TEXT NOT NULL,
  "traditional"     TEXT,
  "reading"         TEXT NOT NULL,
  "english"         TEXT[] NOT NULL,
  "frequency"       FLOAT,
  PRIMARY KEY ("id")
);

CREATE OR REPLACE FUNCTION normalize_pinyin (TEXT) RETURNS TEXT[] AS
$func$
BEGIN
    RETURN ARRAY[$1, regexp_replace($1, '\d( |$)', '\1')];
END;
$func$ LANGUAGE plpgsql IMMUTABLE;

CREATE UNIQUE INDEX idx_cedict_unique ON dict.cedict ("simplified", "traditional", "reading");
CREATE INDEX idx_cedict_frequency ON dict.cedict ("frequency");

CREATE MATERIALIZED VIEW dict.cedict_view AS
  SELECT
    ARRAY["simplified"]||(array_agg(DISTINCT "entry") FILTER (WHERE "entry" IS NOT NULL AND "entry" != "simplified")) "entry",
    (array_agg(DISTINCT "reading") FILTER (WHERE "reading" IS NOT NULL))||'{}'::text[] "pinyin",
    (array_agg(DISTINCT "english") FILTER (WHERE "english" IS NOT NULL))||'{}'::text[] "english",
    max("frequency") "frequency"
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
  ORDER BY max("frequency") DESC NULLS LAST;

CREATE INDEX "idx_cedict_view_entry" ON dict.cedict_view
  USING pgroonga("entry");
CREATE INDEX "idx_cedict_view_pinyin" ON dict.cedict_view
  USING pgroonga (normalize_pinyin("pinyin"));
CREATE INDEX "idx_cedict_view_english" ON dict.cedict_view
  USING pgroonga("english")
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');
