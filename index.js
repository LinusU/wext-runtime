/* globals browser chrome safari */

const hasBrowserGlobal = (typeof browser === 'object')
const hasChromeGlobal = (typeof chrome === 'object')
const hasSafariGlobal = (typeof safari === 'object')

function promisifyChromeCall (call) {
  return new Promise((resolve, reject) => {
    call((result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve(result)
      }
    })
  })
}

function listenUntilResolved (target, eventName, fn) {
  return new Promise((resolve) => {
    target.addEventListener(eventName, function listener (event) {
      fn(event, (result) => {
        target.removeEventListener(eventName, listener)
        resolve(result)
      })
    })
  })
}

exports.getBackgroundPage = function () {
  if (hasBrowserGlobal) {
    return browser.runtime.getBackgroundPage()
  }

  if (hasChromeGlobal) {
    return promisifyChromeCall(cb => chrome.runtime.getBackgroundPage(cb))
  }

  if (hasSafariGlobal) {
    return Promise.resolve(safari.extension.globalPage.contentWindow || null)
  }

  throw new Error('Unsupported platform')
}

let nextReturnId = 0
exports.sendMessage = function (message) {
  if (hasBrowserGlobal) {
    return browser.runtime.sendMessage(message)
  }

  if (hasChromeGlobal) {
    return promisifyChromeCall(cb => chrome.runtime.sendMessage(message, cb))
  }

  if (hasSafariGlobal) {
    if (safari.self.tab) {
      const returnId = `wext-runtime-response-${nextReturnId++}`
      safari.self.tab.dispatchMessage('wext-runtime-message', { message, returnId })

      return listenUntilResolved(safari.self, 'message', (ev, resolve) => {
        if (ev.name === returnId) resolve(ev.message)
      })
    } else {
      const win = safari.extension.globalPage.contentWindow

      return Promise.resolve(typeof win.__wext_runtime_message__ === 'function' ? win.__wext_runtime_message__(message) : undefined)
    }
  }

  throw new Error('Unsupported platform')
}

if (hasBrowserGlobal) {
  exports.onMessage = browser.runtime.onMessage
}

if (hasChromeGlobal) {
  exports.onMessage = chrome.runtime.onMessage
}

if (hasSafariGlobal) {
  const listeners = new Set()

  const receiveMessage = (message) => {
    return new Promise((resolve) => {
      let isAsync = false

      listeners.forEach(fn => {
        if (fn(message, {}, resolve) === true) isAsync = true
      })

      if (isAsync === false) resolve()
    })
  }

  // Calling window.__wext_runtime_message__ from an safari.application
  // event listener sometimes crashes safari. That's why receiveMessage
  // is a separate function, instead of inlined here.
  window.__wext_runtime_message__ = (message) => receiveMessage(message)

  if (typeof safari.application === 'object') {
    safari.application.addEventListener('message', (ev) => {
      if (ev.name !== 'wext-runtime-message') return

      receiveMessage(ev.message.message).then((result) => {
        ev.target.page.dispatchMessage(ev.message.returnId, result)
      })
    })
  }

  exports.onMessage = {
    addListener (fn) { listeners.add(fn) },
    hasListener (fn) { listeners.has(fn) },
    removeListener (fn) { listeners.delete(fn) }
  }
}
