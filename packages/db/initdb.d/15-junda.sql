CREATE TABLE dict.junda (
  "id"            INT NOT NULL,
  "character"     TEXT NOT NULL,
  "frequency"     FLOAT NOT NULL,
  "pinyin"        TEXT[] NOT NULL,
  "english"       TEXT[] NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX idx_junda_frequency ON dict.junda ("frequency");
