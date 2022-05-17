# MO-VID [![update MO-VID data](https://github.com/mgwalker/mo-vid/actions/workflows/update.yml/badge.svg)](https://github.com/mgwalker/mo-vid/actions/workflows/update.yml)

[MO-VID website](https://mgwalker.github.io/mo-vid/)

### What's it for

The [Missouri Department of Health and Senior Services COVID data](https://health.mo.gov/living/healthcondiseases/communicable/novel-coronavirus/data/public-health/)
is updated once a week with the most recent information, but does not include
historical data. This project exists to capture that historical data.
Furthermore, the official data is published as images, not text, making it
inaccessible to anyone who can't see the images for any reason and drastically
increasing the data transfer requirements.

### The data

The MO-VID website includes interpretations of the data and daily-generated
historical graphs. The daily update also includes data files for those who are
interested in doing more interesting things with them. The data is available as
[CSV](https://mgwalker.github.io/mo-vid/mo-vid.csv),
[json](https://mgwalker.github.io/mo-vid/mo-vid.json), and
[sqlite](https://mgwalker.github.io/mo-vid/mo-vid.sqlite). The CSV file contains
one line per day, with the most recent date coming last. The JSON file is an
array of data objects with each object representing a day, with the most recent
date last. The sqlite database includes a table called `mo_vid`.

All of the data formats contain the following data elements, where the JSON and
sqlite formats use the field names shown in the last column. The JSON does not
define a property for fields that are no longer available from the Department of
Health and Senior Services:

| CSV Field                                                   | Type          | Description                                                                                                                             | JSON/sqlite field name                  |
| ----------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| last updated                                                | ISO 8601 date | The date when the data was published by MO DHSS. As a general rule, it covers dates from 3 to 10 days prior.                            | updated                                 |
| start date                                                  | ISO 8601 date | The first date covered by this update                                                                                                   | start                                   |
| end date                                                    | ISO 8601 date | The last date covered by this update                                                                                                    | end                                     |
| 7-day average PCR tests administered                        | number        | The average number of COVID-19 PCR tests administered per day over the 7-day period covered by this update. **No longer published.**    | pcr_tests_7_day_average                 |
| 7-day average PCR tests administered per 100k residents     | number        | Same as above, per 100,000 residents. **No longer published.**                                                                          | pcr_tests_7_day_average_per_100k        |
| 7-day average positive PCR cases                            | number        | The average number of positive COVID-19 PCR tests per day over the 7-day period covered by this update. **No longer published.**        | pcr_positive_7_day_average              |
| 7-day average positive PCR cases per 100k residents         | number        | Same as above, per 100,000 residents                                                                                                    | pcr_positive_7_day_average_per_100k     |
| 7-day PCR positivity rate (percent)                         | number        | The average positivity rate of PCR tests over the 7-day period covered by this update. **No longer published.**                         | pcr_positivity_7_day_percent            |
| 7-day average antigen tests administered                    | number        | The average number of COVID-19 antigen tests administered per day over the 7-day period covered by this update.**No longer published.** | antigen_tests_7_day_average             |
| 7-day average antigen tests administered per 100k residents | number        | Same as above, per 100,000 residents. **No longer published.**                                                                          | antigen_tests_7_day_average_per_100k    |
| 7-day average positive antigen cases                        | number        | The average number of positive COVID-19 antigen tests per day over the 7-day period covered by this update. **No longer published.**    | antigen_positive_7_day_average          |
| 7-day average positive antigen cases per 100k residents     | number        | Same as above, per 100,000 residents. **No longer published.**                                                                          | antigen_positive_7_day_average_per_100k |
| 7-day antigen positivity rate (percent)                     | number        | The average positivity rate of antigens tests over the 7-day period covered by this update. **No longer published.**                    | antigen_positivity_7_day_percent        |
| 7-day average deaths                                        | number        | The average number of deaths due to COVID per day over the 7-day period covered by this update. **No longer published.**                | deaths_7_day_average                    |
| 7-day average deaths per 100k residents                     | number        | Same as above, per 100,000 residents.**No longer published.**                                                                           | deaths_7_day_average_per_100k           |
| 7-day average vaccinations                                  | number        | The average number of vaccinations administered per day over the 7-day period covered by this update. **No longer published.**          | vaccinations_7_day_average              |
| hospitalizations                                            | number        | The average number of people in the hospital for COVID-19 per day over the 7-day period covered by this update.                         | hospitalizations                        |
| in ICU                                                      | number        | The average number of people in intensive care per day over the 7-day period covered by this update.                                    | icu                                     |
| on ventilator                                               | number        | The average number of people on ventilators per day over the 7-day period covered by this update. **No longer published.**              | ventilator                              |
| new cases in the past 7 days                                | number        | The number of new COVID-19 cases in the previous weekly reporting period.                                                               | new_cases_7_day                         |

### Technical bits

Because the [Missouri Department of Health and Senior Services COVID data](https://health.mo.gov/living/healthcondiseases/communicable/novel-coronavirus/data/public-health/)
is published as a bunch of images (seriously!), it's not acessible to people who
use screen readers. In addition, the site uses an API that sends back drawing
instructions instead of the actual data, so it's not even possible to tap into
the raw data to make a more accessible site.

This project uses [Playwright](https://playwright.dev/) to render the page into
a headless browser environment, then grabs the appropriate `canvas` elements
and calls `toDataURL()` on them to get a base-64 encoded representation of the
image they contain. It then decodes those and saves them to disk. Then, it uses
[Tesseract.js](https://tesseract.projectnaptha.com/) to do optical character
recognition on the images to extract the text. A little bit of text cleanup to
get rid of extraneous stuff, and then we're left with the real numeric data.

Finally, this project writes the data into CSV, JSON, and sqlite files to be
consumed by... whoever, really. Go nuts!
