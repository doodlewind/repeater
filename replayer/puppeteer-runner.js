const puppeteer = require('puppeteer-core')
const { join } = require('path')
const genericPool = require('generic-pool')
const fs = require('fs-extra');
const {
  ensureRepeaterDir,
  getJSONByPath,
  getLogNameByPath
} = require('./utils')

const wait = delay => new Promise(resolve => setTimeout(resolve, delay))

const takeScreenshot = async (page, name) => {
  const screenshotPath = join(process.cwd(), `./repeater/${name}.png`)
  await page.screenshot({ path: screenshotPath })
  console.log(`Screenshot for "${name}" is taken.`)
}

const writeCoverage = async (page) => {
  const coverageStore = await page.evaluate(() => window.__coverage__)
  await fs.emptyDir('.nyc_output');
  await Promise.all(
    Object.values(coverageStore).map(coverage => {
      if (coverage) {
        return fs.writeJson(`.nyc_output/${coverage.hash}.json`, { [coverage.path]: coverage })
      }

      return Promise.resolve()
    })
  )
}

// Run log JSON and save screenshot to repeater's tmp dir.
// Logs can have multi window sizes, so fresh browser instance is required.
const runActiveLog = async (browser, log, name) => {
  const [width, height] = [log.viewport.width, log.viewport.height]
  const page = await browser.newPage()
  await page.setViewport({ width, height })
  await page.goto(log.url)

  // TODO adjust overall time-lapse.
  if (typeof log.timeLapse === 'number') {

  }

  const { events } = log
  for (let i = 0; i < events.length; i++) {
    events[i].interval = i === 0
      ? events[i].ts : events[i].ts - events[i - 1].ts
  }

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const { type, x, y, interval, code } = event
    await wait(interval)

    // Ignore click and keypress events.
    if (type === 'mousemove') {
      await page.mouse.move(x, y)
    } else if (type === 'mousedown') {
      // FIXME may lead to redundant move events.
      await page.mouse.move(x, y)
      await page.mouse.down()
    } else if (type === 'mouseup') {
      await page.mouse.up()
    } else if (type === 'dblclick') {
      await page.mouse.click(x, y, { clickCount: 2 })
    } else if (type === 'keydown') {
      await page.keyboard.down(code)
    } else if (type === 'keyup') {
      await page.keyboard.up(code)
    }
  }
  await takeScreenshot(page, name)
}

const runPassiveLog = async (browser, log, name) => {
  const [width, height] = [log.viewport.width, log.viewport.height]
  const page = await browser.newPage()
  await page.setViewport({ width, height })
  await page.goto(log.url)

  await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      if (window.hasRepeaterScreenshot) {
        resolve()
        return
      }

      window.addEventListener('repeater-screenshot', () => resolve())
    })
  })

  await takeScreenshot(page, name)
}

const runLog = async (browser, log, name) => {
  const isPassive = log.mode && log.mode === 'passive'
  if (isPassive) await runPassiveLog(browser, log, name)
  else await runActiveLog(browser, log, name)
}

const createChromePool = async (userOptions) => {
  const { executablePath, headless, poolTimeout, concurrency } = userOptions
  const factory = {
    create () {
      return puppeteer.launch({
        executablePath,
        args: [`--window-size=${global.chromeWidth},${global.chromeHeight}`],
        headless
      })
    },
    destroy (browser) { browser.close() }
  }
  const timeout = poolTimeout * 10e3
  const poolOptions = {
    max: concurrency, acquireTimeoutMillis: timeout, priorityRange: 3
  }

  global.chromePool = genericPool.createPool(factory, poolOptions)
  global.chromePool.on('factoryCreateError', console.error)
  global.chromePool.on('factoryDestroyError', console.error)
}

const destroyChromePool = async () => {
  global.chromePool.drain().then(() => {
    global.chromePool.clear()
  })
}

const batchRun = async (filePaths, userOptions) => {
  ensureRepeaterDir()
  const logs = filePaths.map(getJSONByPath)
  await createChromePool(userOptions)
  const promises = logs.map((log, i) => new Promise((resolve, reject) => {
    global.chromeWidth = log.viewport.width
    global.chromeHeight = log.viewport.height
    global.chromePool.acquire().then(async (browser) => {
      await runLog(browser, log, getLogNameByPath(filePaths[i]))
      await writeCoverage(browser.pages()[0]);
      await global.chromePool.destroy(browser)
      resolve()
    })
  }))
  await Promise.all(promises)
  await destroyChromePool()
}

module.exports = {
  batchRun
}
