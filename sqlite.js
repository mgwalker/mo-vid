import fs from "fs/promises";
import sqlite from "sqlite3";

const fields = JSON.parse(
  await fs.readFile("./fields.json", { encoding: "utf-8" })
).map(({ id, names: { sql: name } }) => ({ id, name }));

const dir = "output";
const path = `${dir}/mo-vid.sqlite`;

const run = async (db, query, params) =>
  new Promise((resolve, reject) => {
    db.run(query, params, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });

const get = async (db, query, params) =>
  new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        return reject(err);
      }
      return resolve(row);
    });
  });

export default async (dates, data) => {
  await fs.mkdir(dir, { recursive: true });
  const [updated, start, end] = dates.split(",");

  const db = new sqlite.Database(path);
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS mo_vid (updated TEXT, start TEXT, end TEXT, ${fields
      .map(({ name }) => name)
      .join(" REAL, ")} REAL)`
  );

  const { count } = await get(
    db,
    "SELECT COUNT(*) as count FROM mo_vid WHERE updated=$updated",
    {
      $updated: updated,
    }
  );

  if (count === 0) {
    const columns = [
      "updated",
      "start",
      "end",
      ...fields.map(({ name }) => name),
    ];
    const values = [updated, start, end, ...fields.map(({ id }) => data[id])];

    const query = `INSERT INTO mo_vid (${columns.join(",")}) VALUES (${values
      .map(() => "?")
      .join(",")})`;
    await run(db, query, values);
  }
};
