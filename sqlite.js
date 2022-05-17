import fs from "fs/promises";
import sqlite from "sqlite3";
import url from "url";

const fields = JSON.parse(
  await fs.readFile("./fields.json", { encoding: "utf-8" })
)
  .filter(({ active }) => active)
  .flatMap(({ fields }) => fields)
  .map(({ id, names: { sql: name }, tracked }) => ({ id, name, tracked }));

const dir = "output";
const path = `${dir}/mo-vid.sqlite`;

const all = async (db, query, params) =>
  new Promise((resolve, reject) => {
    db.all(query, params, (err, out) => {
      if (err) {
        return reject(err);
      }
      return resolve(out);
    });
  });

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

const addData = async (dates, data) => {
  await fs.mkdir(dir, { recursive: true });
  const [updated, start, end] = dates.split(",");

  const db = new sqlite.Database(path);
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS mo_vid (updated TEXT, start TEXT, end TEXT, ${fields
      .map(({ name }) => name)
      .join(" REAL, ")} REAL)`
  );

  const pragma = await all(db, "PRAGMA table_info(mo_vid)");
  const columns = new Set(pragma.map(({ name }) => name));

  await Promise.all(
    fields.map((field) => {
      if (!columns.has(field.name)) {
        return run(db, `ALTER TABLE mo_vid ADD COLUMN ${field.name} REAL`);
      }
      return Promise.resolve();
    })
  );

  const { count } = await get(
    db,
    "SELECT COUNT(*) as count FROM mo_vid WHERE updated=$updated",
    {
      $updated: updated,
    }
  );

  const tracked = fields.filter(({ tracked }) => tracked);

  if (count === 0) {
    const columns = [
      "updated",
      "start",
      "end",
      ...tracked.map(({ name }) => name),
    ];
    const values = [updated, start, end, ...tracked.map(({ id }) => data[id])];

    const query = `INSERT INTO mo_vid (${columns.join(",")}) VALUES (${values
      .map(() => "?")
      .join(",")})`;
    await run(db, query, values);
  }
};

export default addData;

const rebuild = async () => {
  await fs.unlink(path);

  const js = JSON.parse(
    await fs.readFile(`${dir}/mo-vid.json`, { encoding: "utf-8" })
  ).map((data) => ({
    dates: [data.updated, data.start, data.end].join(","),
    data: Object.keys(data)
      .slice(3)
      .reduce((o, key, i) => ({ ...o, [fields[i].id]: data[key] }), {}),
  }));

  for await (const { dates, data } of js) {
    await addData(dates, data);
  }
};

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  rebuild();
}

const db = new sqlite.Database(path);
await run(
  db,
  `CREATE TABLE IF NOT EXISTS mo_vid (updated TEXT, start TEXT, end TEXT, ${fields
    .map(({ name }) => name)
    .join(" REAL, ")} REAL)`
);
