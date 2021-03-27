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
