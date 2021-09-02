CREATE TABLE dict.cedict (
  "id"              INT GENERATED ALWAYS AS IDENTITY,
  "simplified"      TEXT NOT NULL,
  "traditional"     TEXT,
  "reading"         TEXT NOT NULL,
  "english"         TEXT[] NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX idx_cedict_unique ON dict.cedict ("simplified", "traditional", "reading");
