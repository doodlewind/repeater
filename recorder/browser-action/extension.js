/* global chrome */
// Global context is the browser action popup.

const requestTab = (message, onResponse) => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, message, onResponse)
  })
}

const getOptions = () => {
  requestTab({ type: 'getOptions' }, response => {
    const $result = document.getElementById('result')
    $result.innerText = JSON.stringify(response)
  })
}

const init = () => {
  document.getElementById('get-log').addEventListener('click', () => {
    requestTab({ type: 'getLog' }, response => {
      const $result = document.getElementById('result')
      $result.innerText = JSON.stringify(response)
    })
  })

  document.getElementById('get-options').addEventListener('click', getOptions)

  document.getElementById('enable').addEventListener('click', () => {
    requestTab({ type: 'setOptions', data: { enable: true } }, response => {
      const $result = document.getElementById('result')
      $result.innerText = JSON.stringify(response)
    })
  })
}

document.addEventListener('DOMContentLoaded', init)
