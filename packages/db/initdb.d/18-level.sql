CREATE OR REPLACE FUNCTION dict."f_hLevelCheck" (TEXT, INT) RETURNS BOOLEAN AS
$func$
BEGIN
  IF length($1) != 1 THEN
    RETURN $2 IS NULL;
  END IF;

  RETURN TRUE;
END;
$func$ LANGUAGE plpgsql IMMUTABLE;

CREATE TABLE dict.zhlevel (
  "entry"         TEXT NOT NULL,
  "hLevel"        INT,
  "vLevel"        INT,
  PRIMARY KEY ("entry"),
  CONSTRAINT "c_hLevel" CHECK (dict."f_hLevelCheck"("entry", "hLevel"))
);

CREATE INDEX "idx_zhlevel_hLevel" ON dict.zhlevel ("hLevel");
CREATE INDEX "idx_zhlevel_vLevel" ON dict.zhlevel ("vLevel");

CREATE OR REPLACE FUNCTION zhlevel_sentence (TEXT) RETURNS FLOAT AS
$func$
DECLARE
  segments  TEXT[];
  seg       TEXT;
BEGIN
  segments = (
    SELECT array_agg(lexeme) FROM (
      SELECT lexeme, 1 g FROM unnest(to_tsvector('jiebaqry', $1)) WHERE lexeme ~ '[⺀-⺙⺛-⻳⼀-⿕々〇〡-〩〸-〻㐀-䶿一-鿼豈-舘並-龎]'
    ) t1
    GROUP BY g
  );

  RETURN (
    SELECT max("vLevel")::FLOAT * array_length(segments, 1) / COUNT("vLevel") FROM (
      SELECT "vLevel", 1 g FROM dict.zhlevel WHERE entry = ANY(segments) 
    ) t1
    GROUP BY g
  );
END;
$func$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION f_sentence_random (
  IN min INT, IN max INT,
  OUT result TEXT, OUT english TEXT, OUT "level" INT
) AS $$
DECLARE
  r   RECORD;
BEGIN
  FOR r IN (
    WITH match_cte AS (
      SELECT s.entry "entry", s."english" eng, "isTrad"
      FROM sentence s
      JOIN "sentence_isTrad" si ON si.entry = s.entry
    )

    SELECT * FROM (
      SELECT "entry", eng FROM match_cte s
      WHERE NOT "isTrad"
      ORDER BY random()
    ) t1
    UNION ALL
    SELECT * FROM (
      SELECT "entry", eng FROM match_cte s
      WHERE "isTrad"
      ORDER BY random()
    ) t1
  )
  LOOP
    "level" = round(zhlevel_sentence(r.entry));
    IF "level" >= $1 AND "level" <= $2 THEN
      result = r.entry;
      english = r.eng[1];
      RETURN;
    END IF;
  END LOOP;

  result = NULL;
  english = NULL;
  "level" = NULL;
END;
$$ LANGUAGE plpgsql;
