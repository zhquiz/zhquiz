CREATE TABLE dict.cedict (
  "id"              INT GENERATED ALWAYS AS IDENTITY,
  "simplified"      TEXT NOT NULL,
  "traditional"     TEXT,
  "reading"         TEXT NOT NULL,
  "english"         TEXT[] NOT NULL,
  PRIMARY KEY ("id")
);

CREATE OR REPLACE FUNCTION normalize_pinyin (TEXT) RETURNS TEXT[] AS
$func$
BEGIN
    RETURN ARRAY[$1, regexp_replace($1, '\d( |$)', '\1')];
END;
$func$ LANGUAGE plpgsql IMMUTABLE;

CREATE UNIQUE INDEX idx_cedict_unique ON dict.cedict ("simplified", "traditional", "reading");
