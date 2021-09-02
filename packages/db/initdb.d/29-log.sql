CREATE TABLE "log_character" (
  "entry"         TEXT NOT NULL,
  "count"         INT NOT NULL,
  "createdAt"     TIMESTAMPTZ DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY ("entry")
);

CREATE TRIGGER "t_log_character_updatedAt"
  BEFORE UPDATE ON log_character
  FOR EACH ROW
  EXECUTE PROCEDURE "f_updatedAt"();

CREATE INDEX "idx_log_character_updatedAt" ON log_character ("updatedAt");
CREATE INDEX "idx_log_character_count" ON log_character ("count");


CREATE TABLE "log_c2v" (
  "entry"         TEXT NOT NULL,
  "count"         INT NOT NULL,
  "createdAt"     TIMESTAMPTZ DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY ("entry")
);

CREATE TRIGGER "t_log_c2v_updatedAt"
  BEFORE UPDATE ON log_c2v
  FOR EACH ROW
  EXECUTE PROCEDURE "f_updatedAt"();

CREATE INDEX "idx_log_c2v_updatedAt" ON log_c2v ("updatedAt");
CREATE INDEX "idx_log_c2v_count" ON log_c2v ("count");


CREATE TABLE "log_vocabulary" (
  "entry"         TEXT NOT NULL,
  "count"         INT NOT NULL,
  "createdAt"     TIMESTAMPTZ DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY ("entry")
);

CREATE TRIGGER "t_log_vocabulary_updatedAt"
  BEFORE UPDATE ON log_vocabulary
  FOR EACH ROW
  EXECUTE PROCEDURE "f_updatedAt"();

CREATE INDEX "idx_log_vocabulary_updatedAt" ON log_vocabulary ("updatedAt");
CREATE INDEX "idx_log_vocabulary_count" ON log_vocabulary ("count");
