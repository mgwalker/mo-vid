import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Chart from "chartjs-node";

const dir = path.dirname(fileURLToPath(import.meta.url));

const data = JSON.parse(
  await fs.readFile(path.join(dir, "output/mo-vid.json"), {
    encoding: "utf-8",
  })
);

await fs.mkdir(path.join(dir, "docs", "charts"), { recursive: true });

data.forEach(
  (
    {
      pcr_positive_7_day_average: pcr,
      antigen_positive_7_day_average: antigen,
    },
    i
  ) => {
    data[i].totalPositive = pcr + antigen;
  }
);

const labels = data.map(({ end }) => end);

await Promise.all(
  [
    ["totalPositive", "0,0,170"],
    ["vaccinations_7_day_average", "0,170,0"],
    ["hospitalizations", "192,192,0"],
    ["icu", "255,128,0"],
    ["ventilator", "192,64,0"],
    ["deaths_7_day_average", "192,0,0"],
  ].map(async ([field, colorRgb]) => {
    const chart = new Chart([1200, 800], {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "",
            data: data.map((d) => d[field]),
            backgroundColor: `rgba(${colorRgb},0.2)`,
            borderColor: `rgb(${colorRgb})`,
            borderWidth: 3,
            fill: true,
            pointRadius: 0,
          },
        ],
      },
      options: {
        animation: false,
        plugins: {
          legend: { display: false },
        },
        responsive: false,
        scales: {
          x: {
            type: "time",
          },
          y: {
            min: 0,
          },
        },
      },
    });

    chart.save(path.join(dir, `docs/charts/${field}.png`));
  })
);
