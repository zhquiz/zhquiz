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
CREATE INDEX idx_cedict_chinese ON dict.cedict
  USING pgroonga (
    "simplified",
    "traditional",
    normalize_pinyin("reading")
  );
CREATE INDEX idx_cedict_english ON dict.cedict
  USING pgroonga ("english")
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');

CREATE MATERIALIZED VIEW cedict_synonyms AS
  SELECT DISTINCT
    "entry",
    array_agg("alt") "alt"
  FROM (
    SELECT DISTINCT
      "entry",
      unnest("alt") "alt"
    FROM (
      SELECT DISTINCT
        unnest(ARRAY["simplified", "traditional"]) "entry",
        ARRAY["simplified", "traditional"] "alt"
      FROM dict.cedict
    ) t1
    WHERE "alt" IS NOT NULL
    ORDER BY "alt"
  ) t2
  GROUP BY "entry";

CREATE INDEX idx_cedict_synonyms ON cedict_synonyms
  USING pgroonga ("entry" pgroonga_text_term_search_ops_v2);

CREATE OR REPLACE FUNCTION zh_expand (TEXT) RETURNS TEXT AS
$func$
DECLARE
  exp   TEXT := pgroonga_query_expand('cedict_synonyms',
                  'entry',
                  'alt',
                  $1);
BEGIN
  RETURN exp;
END;
$func$ LANGUAGE plpgsql IMMUTABLE;
