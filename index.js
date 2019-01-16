/* eslint-env browser */

const screenshot = () => {
  const event = new CustomEvent('repeater-screenshot')
  dispatchEvent(event)
  window.hasRepeaterScreenshot = true
}

module.exports = {
  screenshot
}
