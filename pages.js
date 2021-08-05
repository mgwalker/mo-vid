import fs from "fs/promises";
import mustache from "mustache";

const formatter = new Intl.NumberFormat("en-US");

(async () => {
  const template = await fs.readFile("template.html", { encoding: "utf-8" });
  const data = JSON.parse(
    await fs.readFile("output/mo-vid.json", { encoding: "utf-8" })
  ).pop();

  data.total_new_cases =
    data.pcr_positive_7_day_average + data.antigen_positive_7_day_average;

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === "number") {
      data[key] = formatter.format(value);
    }
  });

  const page = mustache.render(template, data);
  await fs.writeFile("docs/index.html", page, { encoding: "utf-8" });
})();
