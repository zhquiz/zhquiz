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
    new_arr := new_arr||ARRAY[s, regexp_replace(s, '\d( |$)', '\1', 'g')];
  END LOOP;
  RETURN new_arr;
END;
$func$ LANGUAGE plpgsql IMMUTABLE;

CREATE INDEX idx_junda_frequency ON dict.junda ("frequency");
