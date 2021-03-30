CREATE TABLE online.jukuu (
  "chinese"       TEXT NOT NULL,
  "english"       TEXT NOT NULL,
  PRIMARY KEY ("chinese")
);

CREATE INDEX idx_jukuu_chinese ON online.jukuu
  USING pgroonga ("chinese");
CREATE INDEX idx_jukuu_english ON online.jukuu
  USING pgroonga ("english")
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');

CREATE INDEX idx_jukuu_chinese_tsvector ON online.jukuu
  USING GIN (to_tsvector('jiebaqry', "chinese"));

CREATE TABLE online.jukuu_history (
  "q"             TEXT NOT NULL,
  "count"         INT NOT NULL,
  "createdAt"     TIMESTAMPTZ DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY ("q")
);

CREATE TRIGGER "t_jukuu_history_updatedAt"
  BEFORE UPDATE ON online.jukuu_history
  FOR EACH ROW
  EXECUTE PROCEDURE "f_updatedAt"();

CREATE INDEX "idx_jukuu_history_updatedAt" ON online.jukuu_history ("updatedAt");
CREATE INDEX "idx_jukuu_history_count" ON online.jukuu_history ("count");
