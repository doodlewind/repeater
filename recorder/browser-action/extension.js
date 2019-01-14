/* global chrome */
// Global context is the browser action popup.

const init = () => {
  const $logBtn = document.getElementById('get-log')
  $logBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'getLog' }, response => {
        const $result = document.getElementById('result')
        $result.innerText = JSON.stringify(response)
      })
    })
  })
}

document.addEventListener('DOMContentLoaded', init)
