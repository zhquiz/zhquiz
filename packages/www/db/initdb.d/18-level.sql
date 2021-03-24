CREATE OR REPLACE FUNCTION dict."f_hLevelCheck" (TEXT, INT) RETURNS BOOLEAN AS
$func$
BEGIN
  IF length($1) != 1 THEN
    RETURN $2 = 0;
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
  simp      TEXT[];
  segments  TEXT[];
  seg       TEXT;
BEGIN
  simp = (
    SELECT array_agg(entry)
    FROM (
      SELECT entry, 1 g FROM dict.zhlevel WHERE "hLevel" < 50 AND "hLevel" IS NOT NULL
    ) t1
    GROUP BY g
  );

  segments = (
    SELECT array_agg(lexeme) FROM (
      SELECT lexeme, 1 g FROM unnest(to_tsvector('jiebaqry', $1)) WHERE lexeme ~ re_han()
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

CREATE OR REPLACE FUNCTION dict.f_tatoeba_random_zh (
  IN min INT, IN max INT,
  OUT result TEXT, OUT english TEXT, OUT "level" INT
) AS $$
DECLARE
  r   RECORD;
BEGIN
  FOR r IN (
    SELECT * FROM dict.tatoeba WHERE cmn IS NOT NULL ORDER BY random()
  )
  LOOP
    "level" = round(zhlevel_sentence(r.cmn));
    IF "level" >= $1 AND "level" <= $2 THEN
      result = r.cmn;
      english = r.eng;
      RETURN;
    END IF;
  END LOOP;

  result = NULL;
  english = NULL;
  "level" = NULL;
END;
$$ LANGUAGE plpgsql;
