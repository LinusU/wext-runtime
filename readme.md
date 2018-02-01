# Web Extensions polyfill: `runtime`

Web Extensions polyfill for the `browser.runtime.*` API.

The goal with this package is to implmenet a subset of the Web Extensions API that works for Chrome, Firefox, Safari and Edge.

Since this is a subset of the Web Extensions API, not all properties will be abailable. The best way right now is to look in the `index.d.ts` which holds TypeScript definitions of the properties available. The interface specificed in the TypeScript definitions should work on all platforms.

PRs welcome 🚀

## Installation

```sh
npm install --save @wext/runtime
```

## Usage

*global page:*

```js
const runtime = require('@wext/runtime')

runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message)
  sendResponse('Pong!')
})
```

*browser action:*

```js
const runtime = require('@wext/runtime')

runtime.sendMessage('Ping!').then((response) => {
  console.log(response)
})
```

## Implemented methods

| Feature | Chrome | Firefox | Safari | Edge |
| ------- | :----: | :-----: | :----: | :--: |
| `getBackgroundPage` | ✅ | ✅ | ✅ | ❌ |
| `sendMessage` | ✅ | ✅ | ✅ | ❌ |

## Implemented events

| Feature | Chrome | Firefox | Safari | Edge |
| ------- | :----: | :-----: | :----: | :--: |
| `onMessage` | ✅ | ✅ | ✅ | ❌ |
