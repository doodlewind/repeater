/* global chrome */
// Global context is the browser action popup.

const tabMessage = (message, onResponse) => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, message, onResponse)
  })
}

const getLog = () => {
  tabMessage({ type: 'getLog' }, response => {
    const $result = document.getElementById('result')
    $result.innerText = JSON.stringify(response)
  })
}

const init = () => {
  const $logBtn = document.getElementById('get-log')
  $logBtn.addEventListener('click', getLog)
}

document.addEventListener('DOMContentLoaded', init)
