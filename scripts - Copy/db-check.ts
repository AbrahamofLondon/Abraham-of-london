import Database from "better-sqlite3";

const db = new Database("dev.db");

// 1️⃣ Check table
const table = db
  .prepare(
    "SELECT name, sql FROM sqlite_master WHERE type='table' AND name='short_interactions'"
  )
  .get();

console.log("TABLE:", table);

// 2️⃣ Check trigger
const trigger = db
  .prepare(
    "SELECT name, sql FROM sqlite_master WHERE type='trigger' AND name='trg_short_interactions_updated_at'"
  )
  .get();

console.log("TRIGGER:", trigger);

// 3️⃣ Check updated_at auto-update
db.exec(
  "INSERT INTO short_interactions (short_slug, session_id, action) VALUES ('t1','s1','like')"
);

const before = db
  .prepare(
    "SELECT id, updated_at FROM short_interactions WHERE short_slug='t1'"
  )
  .get();

db.exec(`UPDATE short_interactions SET action='save' WHERE id=${before.id}`);

const after = db
  .prepare("SELECT id, updated_at FROM short_interactions WHERE id=?")
  .get(before.id);

console.log("TIMESTAMPS:", { before, after });

db.close();
