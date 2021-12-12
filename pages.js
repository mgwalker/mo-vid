import dayjs from "dayjs";
import fs from "fs/promises";
import mustache from "mustache";

const formatter = new Intl.NumberFormat("en-US");

await fs.mkdir("docs", { recursive: true });

await Promise.all([
  fs.copyFile("output/mo-vid.csv", "docs/mo-vid.csv"),
  fs.copyFile("output/mo-vid.json", "docs/mo-vid.json"),
  fs.copyFile("output/mo-vid.sqlite", "docs/mo-vid.sqlite"),
]);

const template = await fs.readFile("template.html", { encoding: "utf-8" });
const data = JSON.parse(
  await fs.readFile("output/mo-vid.json", { encoding: "utf-8" })
).pop();

data.total_new_cases =
  data.pcr_positive_7_day_average + data.antigen_positive_7_day_average;

const dates = ["updated", "start", "end"];
Object.entries(data).forEach(([key, value]) => {
  if (typeof value === "number") {
    data[key] = formatter.format(value);
  } else if (dates.includes(key)) {
    data[key] = dayjs(value, "YYYY-MM-DD").format("dddd, MMMM D, YYYY");
  }
});

const page = mustache.render(template, data);
await fs.writeFile("docs/index.html", page, { encoding: "utf-8" });
