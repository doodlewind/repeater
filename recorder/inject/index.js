/* eslint-env browser */
/* global chrome */

/*
Setup global variables.
*/

const defaultOptions = {
  enable: false,
  ignoreIdleMove: true,
  throttleDragMove: true
}

const hookEvents = [
  'mousedown',
  'mousemove',
  'mouseup',
  // 'mousewheel',
  // 'click',
  'keydown',
  // 'keypress',
  'keyup'
]

const log = {
  viewport: { width: null, height: null },
  url: null,
  events: []
}

/*
Setup function deps.
*/

function withHookBefore (originalFn, hookFn) {
  return function () {
    if (hookFn.apply(this, arguments) === false) {
      return
    }
    return originalFn.apply(this, arguments)
  }
}

function hookArgs (originalFn, argsGetter) {
  return function () {
    var _args = argsGetter.apply(this, arguments)
    if (Array.isArray(_args)) {
      for (var i = 0; i < _args.length; i++) arguments[i] = _args[i]
    }
    return originalFn.apply(this, arguments)
  }
}

const hookEventListener = () => {
  EventTarget.prototype.addEventListener = hookArgs(
    EventTarget.prototype.addEventListener,
    function (type, listener, options) {
      const hookedListener = withHookBefore(listener, function (e) {
        const { type, timeStamp } = e
        const ts = timeStamp

        const lastEvent = log.events[log.events.length - 1]
        // Filter redundant events.
        if (lastEvent && lastEvent.ts === ts && lastEvent.type === type) {
          return
        }

        if (type.includes('mouse') || type === 'click') {
          log.events.push({ ts, type, x: e.pageX, y: e.pageY })
        } else if (type.includes('key')) {
          log.events.push({ ts, type, code: e.code })
        } else {
          console.error(`${type} event unmatched`)
        }
        console.log(type, 'hooked')
      })
      if (hookEvents.includes(type)) return [type, hookedListener, options]
    }
  )
}

const initEventHook = () => {
  const options = getOptions()
  if (!options.enable) return
  if (!window) return

  log.viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }
  log.url = window.location.href

  hookEventListener()
  hookEvents.forEach(name => document.addEventListener(name, () => {}))
}

const extractLog = log => {
  log = JSON.parse(JSON.stringify(log))
  const options = getOptions()

  if (!log.events.length) return log

  const groupItem = (items, eq) => {
    if (items.length === 0) return []
    const groups = [[items[0]]]

    for (let i = 1; i < items.length; i++) {
      const lastGroup = groups[groups.length - 1]
      const lastItem = lastGroup[lastGroup.length - 1]
      if (eq(lastItem, items[i])) lastGroup.push(items[i])
      else groups.push([items[i]])
    }
    return groups
  }

  const mergeDoubleClick = (events = []) => {
    if (!events.length) return []

    const results = []
    let i = 0
    while (true) {
      const subEvents = events.slice(i, i + 4)
      if (
        subEvents.length === 4 &&
        subEvents[0].type === 'mousedown' &&
        subEvents[1].type === 'mouseup' &&
        subEvents[2].type === 'mousedown' &&
        subEvents[3].type === 'mouseup' &&
        subEvents[3].ts - subEvents[0].ts < 500 &&
        subEvents.every(e => e.x === subEvents[0].x && e.y === subEvents[0].y)
      ) {
        results.push({ ...subEvents[0], type: 'dblclick' })
        i += 4
      } else {
        results.push(events[i])
        i++
      }

      if (i >= events.length) break
    }
    return results
  }

  if (options.ignoreIdleMove) {
    const filteredEvents = []

    let mousePressed = false
    for (let i = 0; i < log.events.length; i++) {
      const event = log.events[i]
      if (event.type === 'mousedown') {
        mousePressed = true
        filteredEvents.push(event)
      } else if (event.type === 'mouseup') {
        mousePressed = false
        filteredEvents.push(event)
      } else if (event.type === 'mousemove') {
        mousePressed && filteredEvents.push(event)
      } else {
        filteredEvents.push(event)
      }
    }
    log.events = filteredEvents
  }

  if (options.throttleDragMove) {
    const groupedEvents = groupItem(log.events, (a, b) => a.type === b.type)
    log.events = groupedEvents
      .map(group => {
        if (group[0].type !== 'mousemove') return group
        // TODO fine-grained throttle
        return group.length <= 2 ? group : [group[0], group[group.length - 1]]
      })
      .reduce((a, b) => [...a, ...b], [])
  }

  // Merge double click events, or else puppeteer can't simulate it.
  const clickMergedEvents = mergeDoubleClick(log.events)
  log.events = clickMergedEvents

  // Minify float timestamp number (in miliseconds).
  log.events.forEach(x => { x.ts = parseInt(x.ts) })

  // FIXME COMPAT copy support
  // copy(log)
  return log
}

const getOptions = () => localStorage.repeaterOptions
  ? JSON.parse(localStorage.repeaterOptions)
  : defaultOptions

const setOptions = options => {
  localStorage.repeaterOptions = JSON.stringify(options)
}

const initOptions = () => {
  const options = getOptions()
  const currentKeys = Object.keys(options)
  const defaultKeys = Object.keys(options)
  // Ensure options reset on version change.
  if (
    currentKeys.some(key => !defaultKeys.includes(key)) ||
    defaultKeys.some(key => !currentKeys.includes(key))
  ) {
    setOptions(defaultOptions)
  }
}

/*
Setup environments.
*/
if (window) {
  initOptions()
  initEventHook()
}

if (chrome && chrome.runtime) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getLog') {
      sendResponse(extractLog(log))
    } else if (request.type === 'getOptions') {
      sendResponse(getOptions())
    } else if (request.type === 'setOptions') {
      const options = getOptions()
      setOptions({ ...options, ...request.data })
      sendResponse(getOptions())
    }
  })
}

if (typeof module === 'object') {
  module.exports = {

  }
}
