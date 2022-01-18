import fs from "fs/promises";
import { chromium } from "playwright";

const pages = JSON.parse(
  await fs.readFile("./fields.json", { encoding: "utf-8" })
);

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
    await page.waitForSelector(`#view${fields[0].id} canvas`);

    if (primary === true) {
      await saveImage(page, "2929999935253847535_2507015370604109783", "date");
    }
    await Promise.all(
      fields
        .filter(({ tracked }) => tracked)
        .map(async ({ id }) => saveImage(page, id, id))
    );
  } catch (e) {
    console.log(e);
  }
}
await browser.close();
