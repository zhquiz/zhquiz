CREATE TABLE "jukuu_lookup" (
    "q"             TEXT NOT NULL PRIMARY KEY,
    "createdAt"     TIMESTAMPTZ DEFAULT now(),
    "updatedAt"     TIMESTAMPTZ DEFAULT now(),
    "lookupCount"   INT NOT NULL
);

CREATE TRIGGER "t_jukuu_lookup_updatedAt"
    BEFORE UPDATE ON "jukuu_lookup"
    FOR EACH ROW
    EXECUTE PROCEDURE "f_updatedAt"();

CREATE INDEX "idx_jukuu_lookup_lookupDate" ON "jukuu_lookup" ("lookupDate");
CREATE INDEX "idx_jukuu_lookup_count" ON "jukuu_lookup" ("count");
