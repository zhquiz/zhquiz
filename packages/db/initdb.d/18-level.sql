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

CREATE OR REPLACE FUNCTION "f_hLevel" (TEXT) RETURNS INT AS
$func$
DECLARE
  m   INT := 0;
  t   TEXT;
  lv  INT;
BEGIN
  FOR t IN (SELECT regexp_split_to_table($1, ''))
  LOOP
    lv = (
      SELECT "hLevel" FROM (
        SELECT "hLevel"
        FROM dict.zhlevel
        WHERE "hLevel" IS NOT NULL AND "entry" = t
        UNION ALL
        SELECT NULL "hLevel"
      ) t1
      LIMIT 1
    );
    IF lv > m THEN
      m = lv;
    END IF;
  END LOOP;

  IF m = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN m;
END;
$func$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "f_vLevel" (TEXT) RETURNS INT AS
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
    SELECT max("vLevel") * array_length(segments, 1) / COUNT("vLevel") FROM (
      SELECT "vLevel", 1 g FROM dict.zhlevel WHERE entry = ANY(segments) 
    ) t1
    GROUP BY g
  );
END;
$func$ LANGUAGE plpgsql IMMUTABLE;
