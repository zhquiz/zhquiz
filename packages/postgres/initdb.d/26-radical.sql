CREATE TABLE radical (
    "entry"         TEXT NOT NULL PRIMARY KEY,
    "sub"           TEXT[] NOT NULL,
    "sup"           TEXT[] NOT NULL,
    "var"           TEXT[] NOT NULL
);

CREATE INDEX idx_radical_search ON radical
    USING pgroonga ("entry", "sub", "sup", "var")
    WITH (tokenizer='TokenUnigram');

CREATE INDEX idx_radical_synonyms ON radical
    USING pgroonga ("entry" pgroonga_text_term_search_ops_v2)
    WITH (tokenizer='TokenUnigram');

CREATE OR REPLACE FUNCTION character_expand (TEXT) RETURNS TEXT AS
$func$
DECLARE
    exp TEXT := pgroonga_query_expand('radical',
                    'entry',
                    'var',
                    $1);
BEGIN
    RETURN $1||' OR '||exp;
END;
$func$ LANGUAGE plpgsql IMMUTABLE;
