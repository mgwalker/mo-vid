import fs from "fs/promises";
import { chromium } from "playwright";

const fields = JSON.parse(
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

(async () => {
  await fs.rmdir("screenshots", { recursive: true });
  await fs.mkdir("screenshots", { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 5 });
  const page = await context.newPage();
  await page.goto(
    "https://results.mo.gov/t/COVID19/views/COVID-19PublicDashboards/Executive?:embed=y&:showVizHome=no&:host_url=https://results.mo.gov/"
  );

  try {
    await page.waitForSelector(`#view${fields[0].id} canvas`);

    await saveImage(page, "2929999935253847535_2507015370604109783", "date");
    await Promise.all(fields.map(async ({ id }) => saveImage(page, id, id)));
  } catch (e) {
    console.log(e);
  }

  await browser.close();
})();
