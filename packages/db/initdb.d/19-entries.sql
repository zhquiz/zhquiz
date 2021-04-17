CREATE TABLE dict.entries (
  "id"              UUID NOT NULL DEFAULT uuid_generate_v4(),
  "type"            TEXT NOT NULL,
  "source"          TEXT,
  "originalId"      INT,
  "entry"           TEXT[] NOT NULL CHECK ("entry"[1] IS NOT NULL),
  "pinyin"          TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  "english"         TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  "tag"             TEXT[] NOT NULL GENERATED ALWAYS AS (ARRAY["source"]) STORED,
  "frequency"       FLOAT,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX idx_entries_u ON dict.entries (("entry"[1]), "type");
CREATE UNIQUE INDEX idx_entries_u2 ON dict.entries ("type", "source", "originalId");

CREATE INDEX idx_entries_type ON dict.entries ("type");

CREATE INDEX idx_entries_pinyin ON dict.entries
  USING pgroonga (normalize_pinyin("pinyin"));
CREATE INDEX idx_entries_english ON dict.entries
  USING pgroonga("english")
  WITH (plugins='token_filters/stem', token_filters='TokenFilterStem');

CREATE INDEX idx_entries_entry ON dict.entries USING pgroonga("entry");
CREATE INDEX idx_entries_entry_gin ON dict.entries USING GIN("entry");

CREATE INDEX idx_entries_ ON dict.entries USING pgroonga ("tag");
