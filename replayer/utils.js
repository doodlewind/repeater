const fs = require('fs')
const { join, basename } = require('path')
const glob = require('glob')
const os = require('os')

const batchUpdateScreenshot = jsonPaths => {
  const logNames = jsonPaths.map(getLogNameByPath)
  logNames.forEach((logName, i) => {
    const screenshotPath = join(process.cwd(), './.repeater', `${logName}.png`)
    const distPath = jsonPaths[i].replace('.json', '.png')
    fs.copyFileSync(screenshotPath, distPath)
  })
}

const fileExists = filePath => {
  try { return fs.statSync(filePath).isFile() } catch (err) { return false }
}

const ensureDir = dirName => {
  const dirPath = join(process.cwd(), dirName)
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath)
}

const getActionByJSON = (name, update) => {
  const jsonPath = join(process.cwd(), name)

  if (!fileExists(jsonPath)) return { type: 'single-not-found' }

  if (update) return { type: 'single-update' }

  const screenshotPath = jsonPath.replace('.json', '.png')

  return fileExists(screenshotPath)
    ? { type: 'single-test' }
    : { type: 'single-update' }
}

const getActionByDir = (name, update) => {
  const cwd = join(process.cwd(), name)
  if (!fs.existsSync(cwd)) return Promise.resolve('batch-not-found')

  return new Promise((resolve, reject) => {
    glob('**/*.{json,png}', { cwd }, (err, matches) => {
      if (err) return resolve({ type: 'batch-error' })

      const matchedLogs = matches.filter(name => name.includes('.json'))
      const matchedLogNames = matchedLogs.map(log => log.replace('.json', ''))
      const allLogHasScreenshot = matchedLogNames.every(logName => (
        matches.some(name => name.includes(logName) && name.includes('.png'))
      ))

      if (allLogHasScreenshot && !update) {
        return resolve({ type: 'batch-test', files: matchedLogs })
      }

      if (update) {
        return resolve({ type: 'batch-update', files: matchedLogs })
      }

      return resolve({ type: 'batch-invalid' })
    })
  })
}

const getActionByLocation = (location, update) => location.includes('.json')
  ? Promise.resolve(getActionByJSON(location, update))
  : getActionByDir(location, update)

const getDefaultChromiumPath = () => {
  return os.platform() === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
}

const getJSONByPath = jsonPath => JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

const getLogNameByPath = filePath => basename(filePath).replace('.json', '')

const writeJSON = (path, json) => new Promise((resolve, reject) => {
  fs.writeFile(path, JSON.stringify(json), (err) => {
    if (err) reject(err)
    resolve()
  })
})

const writeCoverage = async page => {
  const coverageStore = await page.evaluate(() => window.__coverage__)
  ensureDir('./.nyc_output')

  if (!coverageStore) return

  await Promise.all(
    Object.values(coverageStore).map(coverage => {
      console.log(coverageStore)
      if (coverage) {
        return writeJSON(
          `.nyc_output/${coverage.hash}.json`, { [coverage.path]: coverage }
        )
      }

      return Promise.resolve()
    })
  )
}

module.exports = {
  batchUpdateScreenshot,
  ensureDir,
  getActionByLocation,
  getDefaultChromiumPath,
  getJSONByPath,
  getLogNameByPath,
  writeCoverage
}
