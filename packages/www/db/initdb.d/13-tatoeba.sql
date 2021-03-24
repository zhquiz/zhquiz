CREATE TABLE dict.tatoeba (
  "id"            INT NOT NULL,
  "cmn"           TEXT,
  "eng"           TEXT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX idx_tatoeba_cmn ON dict.tatoeba
  USING pgroonga ("cmn");
CREATE INDEX idx_tatoeba_eng ON dict.tatoeba
  USING pgroonga ("eng")
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');

CREATE INDEX idx_tatoeba_cmn_tsvector ON dict.tatoeba
  USING GIN (to_tsvector('jiebaqry', "cmn"));

CREATE OR REPLACE FUNCTION re_han () RETURNS TEXT AS
$func$
BEGIN
  RETURN '[⺀-⺙⺛-⻳⼀-⿕々〇〡-〩〸-〻㐀-䶿一-鿼豈-舘並-龎]';
END;
$func$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;
