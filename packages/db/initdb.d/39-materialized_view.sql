CREATE OR REPLACE FUNCTION "f_sentence_hLevel" (TEXT) RETURNS INT AS
$func$
DECLARE
  m   INT := 0;
  t   TEXT;
  lv  INT;
BEGIN
  FOR t IN (SELECT regexp_matches($1, '[⺀-⺙⺛-⻳⼀-⿕々〇〡-〩〸-〻㐀-䶿一-鿼豈-舘並-龎]', 'g'))
  LOOP
    lv = (
      SELECT "hLevel" FROM (
        SELECT "hLevel"
        FROM dict.zhlevel
        WHERE "hLevel" IS NOT NULL AND "entry" = t
        UNION ALL
        SELECT 100 "hLevel"
      ) t1
      LIMIT 1
    );
    IF lv > m THEN
      m = lv;
    END IF;
  END LOOP;
  
  RETURN m;
END;
$func$ LANGUAGE plpgsql;
