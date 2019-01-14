/* global chrome */
// Global context is the browser action popup.

const requestTab = (message, onResponse) => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, message, onResponse)
  })
}

const extractLog = () => {
  requestTab({ type: 'getLog' }, response => {
    const $result = document.getElementById('result')
    $result.innerText = JSON.stringify(response)
  })
}

const init = () => {
  const $logBtn = document.getElementById('get-log')
  $logBtn.addEventListener('click', extractLog)

  const $optionsBtn = document.getElementById('get-options')
  $optionsBtn.addEventListener('click', () => {
    requestTab({ type: 'getOptions' }, response => {
      const $result = document.getElementById('result')
      $result.innerText = JSON.stringify(response)
    })
  })
}

document.addEventListener('DOMContentLoaded', init)
