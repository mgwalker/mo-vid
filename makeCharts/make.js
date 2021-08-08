import fs from "fs/promises";
import http from "http";
import path from "path";
import { chromium } from "playwright";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));

const data = await fs.readFile(path.join(dir, "..", "output/mo-vid.json"));
const html = await fs.readFile(path.join(dir, "chart.html"));

const sleep = async (ms) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });

const serve = async () =>
  new Promise((resolve) => {
    const requestListener = async (req, res) => {
      if (req.url === "data" || req.url === "/data") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(data);
      } else {
        res.writeHead(200);
        res.end(html);
      }
    };

    const server = http.createServer(requestListener);
    server.listen(8080, () => {
      resolve({
        close: () => {
          server.close();
        },
      });
    });
  });

const server = await serve();

await fs.rmdir(path.join(dir, "..", "docs/charts"), { recursive: true });
await fs.mkdir(path.join(dir, "..", "docs/charts"), { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ deviceScaleFactor: 5 });
const page = await context.newPage();
await page.goto("http://localhost:8080");

await sleep(500);

const runInBrowser = async ([field, colorRgb]) => {
  return await window.draw(field, colorRgb);
};

const saveChart = async (field, colorRgb) => {
  const dataUrl = await page.evaluate(runInBrowser, [field, colorRgb]);

  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  await fs.writeFile(
    path.join(dir, "..", `docs/charts/${field}.png`),
    Buffer.from(base64, "base64")
  );
};

const charts = [
  ["totalPositive", "0,0,170"],
  ["vaccinations_7_day_average", "0,170,0"],
  ["hospitalizations", "192,192,0"],
  ["icu", "255,128,0"],
  ["ventilator", "192,64,0"],
  ["deaths_7_day_average", "192,0,0"],
];

for (const [field, colorRgb] of charts) {
  await saveChart(field, colorRgb);
}

await browser.close();
server.close();
