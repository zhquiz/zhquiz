CREATE TABLE "jukuu_lookup" (
    "q"             TEXT NOT NULL PRIMARY KEY,
    "createdAt"     TIMESTAMPTZ DEFAULT now(),
    "updatedAt"     TIMESTAMPTZ DEFAULT now(),
    "count"         INT NOT NULL
);

CREATE TRIGGER "t_jukuu_lookup_updatedAt"
    BEFORE UPDATE ON "jukuu_lookup"
    FOR EACH ROW
    EXECUTE PROCEDURE "f_updatedAt"();

CREATE INDEX "idx_jukuu_lookup_count" ON "jukuu_lookup" ("count");
