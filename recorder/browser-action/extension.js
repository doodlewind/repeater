/* global chrome */
// Global context is the browser action popup.

const refreshPage = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const code = 'window.location.reload();'
    chrome.tabs.executeScript(tabs[0].id, { code })
  })
}

const requestTab = (message, onResponse) => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, message, onResponse)
  })
}

const getOptions = onResponse => {
  requestTab({ type: 'getOptions' }, options => onResponse(options))
}

const toCamel = str => str
  .split('-')
  .map((str, i) => i === 0 ? str : str[0].toUpperCase() + str.substr(1))
  .join('')

const updateTabState = () => {
  const data = {
    ignoreIdleMove: document.getElementById('ignore-idle-move').checked,
    throttleDragMove: document.getElementById('throttle-drag-move').checked
  }
  requestTab({ type: 'setOptions', data }, () => {})
}

// https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
const copyToClipboard = (text) => {
  const textArea = document.createElement('textarea')

  textArea.style.position = 'fixed'
  textArea.style.top = 0
  textArea.style.left = 0
  textArea.style.width = '2em'
  textArea.style.height = '2em'
  textArea.style.padding = 0
  textArea.style.border = 'none'
  textArea.style.outline = 'none'
  textArea.style.boxShadow = 'none'
  textArea.style.background = 'transparent'

  textArea.value = text

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
}

const init = () => {
  getOptions(options => {
    // Init form options with tab state.

    document.querySelectorAll('input[name="switch"]').forEach($switch => {
      const switchType = !!parseInt($switch.value)

      $switch.checked = options.enable === switchType
      $switch.onchange = () => {
        const message = { type: 'setOptions', data: { enable: switchType } }
        requestTab(message, refreshPage)
      }
    })

    const optionIds = ['ignore-idle-move', 'throttle-drag-move']
    optionIds.forEach(id => {
      const $option = document.getElementById(id)
      $option.onchange = updateTabState
      $option.checked = options[toCamel(id)]
    })
  })

  document.getElementById('get-log').onclick = () => {
    requestTab({ type: 'getLog' }, log => {
      copyToClipboard(JSON.stringify(log, null, 2))
    })
  }
}

document.addEventListener('DOMContentLoaded', init)
