CREATE TABLE "library" (
  "id"              UUID NOT NULL DEFAULT uuid_generate_v4(),
  "createdAt"       TIMESTAMPTZ DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ DEFAULT now(),
  "userId"          UUID,
  "isShared"        BOOLEAN,
  "type"            TEXT NOT NULL,
  "entries"         JSONB NOT NULL CHECK ("entries" -> 0 -> 'entry' IS NOT NULL),
  "title"           TEXT NOT NULL,
  "description"     TEXT NOT NULL DEFAULT '',
  "tag"             TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  PRIMARY KEY ("id"),
  CONSTRAINT
    fk_userId
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TRIGGER "t_library_updatedAt"
  BEFORE UPDATE ON "library"
  FOR EACH ROW
  EXECUTE PROCEDURE "f_updatedAt"();

CREATE INDEX "idx_library_updatedAt" ON "library" ("updatedAt");
CREATE INDEX "idx_library_userId" ON "library" ("userId");
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
