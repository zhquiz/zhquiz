CREATE MATERIALIZED VIEW dict.tatoeba_view AS
  SELECT
    "cmn",
    "eng",
    "isTrad"
  FROM (
    SELECT
      "cmn",
      "eng",
      (dict."f_hLevel"(regexp_matches("cmn", '[⺀-⺙⺛-⻳⼀-⿕々〇〡-〩〸-〻㐀-䶿一-鿼豈-舘並-龎]', 'g')) > 50) "isTrad"
    FROM dict.tatoeba
  ) t1
  ORDER BY "isTrad";

CREATE INDEX idx_tatoeba_view_unique ON dict.tatoeba_view ("cmn");

CREATE INDEX "idx_tatoeba_view_isTrad" ON dict.tatoeba_view ("isTrad");

CREATE INDEX idx_tatoeba_view_cmn ON dict.tatoeba_view
  USING pgroonga ("cmn");
CREATE INDEX idx_tatoeba_view_eng ON dict.tatoeba_view
  USING pgroonga ("eng")
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');

CREATE INDEX idx_tatoeba_view_cmn_tsvector ON dict.tatoeba_view
  USING GIN (to_tsvector('jiebaqry', "cmn"));
