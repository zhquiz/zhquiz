import sqlite from 'better-sqlite3'

const db = sqlite('data.db')

// db.exec(/* sql */ `
// CREATE TABLE user (
//   [name]    TEXT,
//   meta      JSON DEFAULT '{}',
//   updatedAt TIMESTAMP DEFAULT (strftime('%s','now'))
// );
// `)

db.exec(/* sql */ `
INSERT INTO user ([name]) VALUES ('a');
`)

// db.exec(/* sql */ `
// CREATE TRIGGER t_user_updatedAt BEFORE UPDATE ON user
// FOR EACH ROW
// WHEN NEW.updatedAt = OLD.updatedAt
// BEGIN
//   UPDATE user SET updatedAt = strftime('%s', 'now') WHERE ROWID = NEW.ROWID;
// END;
// `)

db.exec(/* sql */ `
UPDATE user SET [name] = 'b' WHERE oid = 1;
`)

console.log(db.prepare(/* sql */ `SELECT *, json(meta), oid FROM user`).all())

db.close()
