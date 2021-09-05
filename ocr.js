import dayjs from "dayjs";
import fs from "fs/promises";
import { createWorker } from "tesseract.js";
import utc from "dayjs/plugin/utc.js";
import csv from "./csv.js";
import json from "./json.js";
import sqlite from "./sqlite.js";

dayjs.extend(utc);

const fields = JSON.parse(
  await fs.readFile("./fields.json", { encoding: "utf-8" })
);

const worker = createWorker({
  logger: () => false,
});

await worker.load();
await worker.loadLanguage("eng");
await worker.initialize("eng");

const dates = await (async () => {
  const {
    data: { text },
  } = await worker.recognize("./screenshots/date.png");
  const [, updated] = text.match(/updated on (\d+\/\d+\/\d{4})\./i);

  const latest = dayjs.utc(updated);
  return [
    latest.format("YYYY-MM-DD"),
    dayjs(latest).subtract(9, "days").format("YYYY-MM-DD"),
    dayjs(latest).subtract(3, "days").format("YYYY-MM-DD"),
  ].join(",");
})();

const ocrNextImage = async function* () {
  const ids = fields.map(({ id }) => id);
  while (ids.length) {
    const id = ids.pop();

    const {
      data: { text },
    } = await worker.recognize(`./screenshots/${id}.png`);

    yield {
      [id]: +text
        .replace(/\n/g, " ")
        .replace(/7 (per)?day/gi, "")
        .replace(/per 100k residents/gi, "")
        .replace(/covid-?\S+/gi, "")
        .replace(/as ?of ?\d+\/\d+\/\d+/gi, "")
        .replace(/\([^)]*\)/g, "")
        .replace(/[^\d.]/g, ""),
    };
  }
};

let allData = {};
for await (const data of ocrNextImage()) {
  allData = { ...allData, ...data };
}

await worker.terminate();

await Promise.all([
  csv(dates, allData),
  json(dates, allData),
  sqlite(dates, allData),
]);
