import fs from "fs/promises";
import exists from "./exists.js";

const allFields = JSON.parse(
  await fs.readFile("./fields.json", { encoding: "utf-8" })
);

const fields = allFields
  .flatMap(({ fields }) => fields)
  .map(({ id, names: { csv: name }, tracked }) => ({ id, name, tracked }));

const primary = allFields
  .filter(({ active }) => active)
  .flatMap(({ fields }) => fields)
  .map(({ id, names: { csv: name }, tracked }) => ({ id, name, tracked }));

for (const field of primary) {
  const dupes = fields.filter(
    ({ id, name }) => id !== field.id && name === field.name
  );

  if (dupes.length) {
    const primaryIndex = fields.findIndex(({ id }) => id === field.id);
    fields.splice(primaryIndex, 1);
    dupes.forEach((dupe) => (dupe.id = field.id));
  }
}

const dir = "output";
const path = `${dir}/mo-vid.csv`;

export default async (dates, data) => {
  await fs.mkdir(dir, { recursive: true });

  const sorted = [];
  fields.forEach(({ id, tracked }) => {
    sorted.push(tracked ? data[id] : "");
  });

  if (await exists(path)) {
    const file = await fs.readFile(path, { encoding: "utf-8" });

    const alreadyUpdated =
      file.split("\n").slice(-2, -1).pop().split(",").slice(0, 3).join(",") ===
      dates;

    const headers = file.split("\n").slice(0, 1).pop().split(",");

    // subtract 3 to account for dates, which aren't stored alongside the fields
    // metadata
    if (headers.length - 3 < fields.length) {
      const missing = fields.slice(headers.length - 3);
      headers.push(...missing.map(({ name }) => name));

      const lines = file
        .trim()
        .split("\n")
        .slice(1)
        .map((l) => `${l},`)
        .join("\n");

      await fs.writeFile(path, `${headers.join(",")}\n${lines}\n`);
    }

    if (!alreadyUpdated) {
      await fs.appendFile(path, `${dates},${sorted.join(",")}\n`, {
        encoding: "utf-8",
      });
    }
  } else {
    const lines = [
      `last updated,start date,end date,${fields
        .map(({ name }) => name)
        .join(",")}`,
      `${dates},${sorted.join(",")}`,
      "",
    ];
    await fs.writeFile(path, lines.join("\n", { encoding: "utf-8" }));
  }
};
