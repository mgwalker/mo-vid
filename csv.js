import fs from "fs/promises";
import exists from "./exists.js";

const fields = JSON.parse(
  await fs.readFile("./fields.json", { encoding: "utf-8" })
).map(({ id, names: { csv: name } }) => ({ id, name }));

const dir = "output";
const path = `${dir}/mo-vid.csv`;

export default async (dates, data) => {
  await fs.mkdir(dir, { recursive: true });

  const sorted = [];
  fields.forEach(({ id }) => {
    sorted.push(data[id]);
  });

  if (await exists(path)) {
    const alreadyUpdated = await fs
      .readFile(path, { encoding: "utf-8" })
      .then(
        (f) =>
          f.split("\n").slice(-2, -1).pop().split(",").slice(0, 3).join(",") ===
          dates
      );

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
