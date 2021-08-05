# MO-VID

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
