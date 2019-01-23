/* eslint-env browser */
/* global copy */

const screenshot = () => {
  const event = new CustomEvent('repeater-screenshot')
  dispatchEvent(event)
  window.hasRepeaterScreenshot = true
}

const initHelpers = () => {
  window.copyLog = () => {
    addEventListener('repeater-copy-log', e => {
      copy && copy(e.detail)
    })

    const event = new CustomEvent('repeater-extract-log')
    dispatchEvent(event)
  }
}

module.exports = {
  screenshot,
  initHelpers
}
