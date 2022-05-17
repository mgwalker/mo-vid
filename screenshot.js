import fs from "fs/promises";
import { chromium } from "playwright";

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });

const pages = JSON.parse(
  await fs.readFile("./fields.json", { encoding: "utf-8" })
).filter(({ active }) => active);

const getDataUrl = (domId) => {
  const canvas = document.querySelector(`#view${domId} canvas`);
  return canvas.toDataURL();
};

const saveImage = async (page, id, filename) => {
  const dataUrl = await page.evaluate(getDataUrl, id);

  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  await fs.writeFile(
    `screenshots/${filename}.png`,
    Buffer.from(base64, "base64")
  );
};

await fs.rm("screenshots", { force: true, recursive: true });
await fs.mkdir("screenshots", { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ deviceScaleFactor: 5 });

for (const { fields, primary, source } of pages) {
  const page = await context.newPage();
  await page.goto(source);

  try {
    await page.waitForSelector(`#view${fields[0].domId} canvas`);

    if (primary === true) {
      await saveImage(page, "1101353918436015903_1210198737766094474", "date");
    }

    const images = fields.filter(({ tracked }) => tracked);
    for await (const { id, domId, click } of images) {
      if (click) {
        await page.check(`#${click}`);
        await sleep(2_000);
      }
      await saveImage(page, domId, id);
    }
  } catch (e) {
    console.log(e);
  }
}
await browser.close();
