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
  console.log('TODO update tab state')
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
}

document.addEventListener('DOMContentLoaded', init)
