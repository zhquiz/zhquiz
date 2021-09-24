CREATE OR REPLACE FUNCTION unwrap_entries (JSONB) RETURNS TEXT[] AS
$func$
DECLARE
    it    JSONB;
    "out" TEXT[] := '{}'::text[];
BEGIN
    FOR it IN (SELECT * FROM jsonb_array_elements($1))
    LOOP
        "out" := "out"||(it ->> 'entry');
    END LOOP;

    RETURN "out";
END;
$func$ LANGUAGE plpgsql IMMUTABLE;

CREATE TABLE "library" (
    "id"              UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    "createdAt"       TIMESTAMPTZ DEFAULT now(),
    "updatedAt"       TIMESTAMPTZ DEFAULT now(),
    "userId"          UUID NOT NULL DEFAULT uuid_nil() REFERENCES "user"("id") ON DELETE CASCADE,
    "isShared"        BOOLEAN,
    "type"            TEXT NOT NULL,
    "entries"         JSONB NOT NULL CHECK ("entries" -> 0 -> 'entry' IS NOT NULL),
    "entry"           TEXT[] GENERATED ALWAYS AS (unwrap_entries("entries")) STORED,
    "title"           TEXT NOT NULL,
    "description"     TEXT NOT NULL DEFAULT '',
    "tag"             TEXT[] NOT NULL DEFAULT '{}'::TEXT[]
);

CREATE TRIGGER "t_library_updatedAt"
    BEFORE UPDATE ON "library"
    FOR EACH ROW
    EXECUTE PROCEDURE "f_updatedAt"();

CREATE INDEX "idx_library_updatedAt" ON "library" ("updatedAt");
CREATE INDEX "idx_library_userId" ON "library" ("userId");
CREATE INDEX "idx_library_isShared" ON "library" ("isShared");
CREATE INDEX "idx_library_type" ON "library" ("type");

CREATE INDEX "idx_library_entry" ON "library"
    USING pgroonga("entry");
CREATE INDEX "idx_library_title_description" ON "library"
    USING pgroonga(
        "title",
        "description"
    )
    WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');
CREATE INDEX "idx_library_tag" ON "library" USING pgroonga ("tag");
