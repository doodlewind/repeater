const fs = require('fs')
const { join } = require('path')
const { PNG } = require('pngjs')
const pixelmatch = require('pixelmatch')
const {
  getLogNameByPath
} = require('./utils')

const testImage = (filePath, options) => new Promise((resolve, reject) => {
  const logName = getLogNameByPath(filePath)
  const expectedPath = join(process.cwd(), './.repeater', `${logName}.png`)
  const expectedImg = fs
    .createReadStream(expectedPath).pipe(new PNG()).on('parsed', doneReading)

  const actualPath = filePath.replace('.json', '.png')
  const actualImg = fs
    .createReadStream(actualPath).pipe(new PNG()).on('parsed', doneReading)

  let filesRead = 0

  function doneReading () {
    if (++filesRead < 2) return
    const { width, height } = expectedImg
    const diff = new PNG({ width, height })

    const mismatchedPixels = pixelmatch(
      expectedImg.data,
      actualImg.data,
      diff.data,
      expectedImg.width,
      expectedImg.height,
      { threshold: 0.1 }
    )
    const ratio = mismatchedPixels / (expectedImg.width * expectedImg.height)
    const ratioStr = (ratio * 100).toFixed(2)

    const pass = ratio < options.diffThreshold / 100

    if (pass) {
      console.log(`Test "${logName}" passed with ${ratioStr}% difference.`)
      resolve({ result: true, ratio })
    } else {
      const diffPath = join(process.cwd(), `./.repeater/${logName}-diff.png`)
      diff.pack().pipe(fs.createWriteStream(diffPath))
        .on('finish', () => {
          console.error(
            `Test "${logName}" failed with ${ratioStr}% difference.`
          )
          console.error(`See ./.repeater/${logName}-diff.png for details.`)
          reject(new Error({ result: false, ratio }))
        })
        .on('error', reject)
    }
  }
})

const batchTest = async (filePaths, options) => {
  const promises = filePaths.map(filePath => testImage(filePath, options))
  try { await Promise.all(promises) } catch (e) { process.exitCode = 1 }
}

module.exports = {
  batchTest
}
