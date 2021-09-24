CREATE OR REPLACE FUNCTION "f_updatedAt"()   
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;   
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION normalize_pinyin (TEXT) RETURNS TEXT[] AS
$func$
BEGIN
    RETURN ARRAY[$1, regexp_replace($1, '\d( |$)', '\1', 'g')];
END;
$func$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION normalize_pinyin (TEXT[]) RETURNS TEXT[] AS
$func$
DECLARE
    s       TEXT;
    new_arr TEXT[] := '{}';
BEGIN
    FOREACH s IN ARRAY $1||'{}'::text[] LOOP
        new_arr := new_arr||ARRAY[s, regexp_replace(s, '\d( |$)', '\1', 'g')];
    END LOOP;
    RETURN new_arr;
END;
$func$ LANGUAGE plpgsql IMMUTABLE;

CREATE FUNCTION array_distinct(anyarray) RETURNS anyarray AS $f$
    SELECT array_agg(DISTINCT x) FROM unnest($1) t(x);
$f$ LANGUAGE SQL IMMUTABLE;
