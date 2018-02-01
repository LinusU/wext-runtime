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

exports.sendMessage = function (message) {
  if (hasBrowserGlobal) {
    return browser.runtime.sendMessage(message)
  }

  if (hasChromeGlobal) {
    return promisifyChromeCall(cb => chrome.runtime.sendMessage(message, cb))
  }

  if (hasSafariGlobal) {
    if (safari.self.tab) {
      // FIXME: Handle sending return value back
      // safari.self.tab.dispatchMessage('wext-runtime-message', message)
      throw new Error('Not implemented')
    } else {
      const win = safari.extension.globalPage.contentWindow

      if (typeof win.__wext_runtime_message__ === 'function') {
        return new Promise((resolve, reject) => win.__wext_runtime_message__(message).then(resolve, reject))
      } else {
        return Promise.resolve()
      }
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

  window.__wext_runtime_message__ = (message) => {
    return new Promise((resolve) => {
      let isAsync = false

      listeners.forEach(fn => {
        if (fn(message, {}, resolve) === true) isAsync = true
      })

      if (isAsync === false) resolve()
    })
  }

  // FIXME: Handle sending return value back
  // safari.application.addEventListener('message', (ev) => {
  //   if (ev.name === 'wext-runtime-message') {
  //     listeners.forEach(fn => fn(ev.target, ...))
  //   }
  // })

  exports.onMessage = {
    addListener (fn) { listeners.add(fn) },
    hasListener (fn) { listeners.has(fn) },
    removeListener (fn) { listeners.delete(fn) }
  }
}
