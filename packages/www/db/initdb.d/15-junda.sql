CREATE TABLE dict.junda (
  "id"            INT NOT NULL,
  "character"     TEXT NOT NULL,
  "frequency"     FLOAT NOT NULL,
  "pinyin"        TEXT[] NOT NULL,
  "english"       TEXT[] NOT NULL,
  PRIMARY KEY ("id")
);

CREATE OR REPLACE FUNCTION normalize_pinyin (TEXT[]) RETURNS TEXT[] AS
$func$
DECLARE
    s       TEXT;
    new_arr TEXT[] := '{}';
BEGIN
    FOREACH s IN ARRAY $1||'{}'::text[] LOOP
        new_arr := new_arr || normalize_pinyin(s);
    END LOOP;
    RETURN new_arr;
END;
$func$ LANGUAGE plpgsql IMMUTABLE;

CREATE UNIQUE INDEX idx_junda_character ON dict.junda ("character");

CREATE INDEX idx_junda_frequency ON dict.junda ("frequency");

CREATE INDEX idx_junda_pinyin ON dict.junda
  USING pgroonga (normalize_pinyin("pinyin"));
CREATE INDEX idx_junda_english ON dict.junda
  USING pgroonga ("english")
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');
