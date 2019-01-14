/* global chrome */

chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
  if (!chrome.pageAction) return

  chrome.pageAction.show(sender.tab.id)
  sendResponse()
})
