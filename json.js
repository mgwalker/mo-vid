import fs from "fs/promises";
import exists from "./exists.js";

const fields = JSON.parse(
  await fs.readFile("./fields.json", { encoding: "utf-8" })
)
  .filter(({ active }) => active)
  .flatMap(({ fields }) => fields)
  .map(({ id, names: { json: name }, tracked }) => ({ id, name, tracked }));

const dir = "output";
const path = `${dir}/mo-vid.json`;

export default async (dates, data) => {
  await fs.mkdir(dir, { recursive: true });
  const [updated, start, end] = dates.split(",");

  const output = [];
  if (await exists(path)) {
    output.push(...JSON.parse(await fs.readFile(path, { encoding: "utf-8" })));
    if (output.slice(-1).pop().updated === updated) {
      return;
    }
  }

  const newData = {
    updated,
    start,
    end,
  };
  fields.forEach(({ id, name, tracked }) => {
    newData[name] = tracked ? data[id] : "";
  });
  output.push(newData);

  await fs.writeFile(path, JSON.stringify(output, null, 2), {
    encoding: "utf-8",
  });
};
