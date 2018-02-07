declare function getBackgroundPage(): Promise<Window | null>
export { getBackgroundPage }

declare function sendMessage<T = void> (message: any): Promise<T>
export { sendMessage }

export interface Event<T extends Function> {
  addListener (callback: T): void
  hasListener (callback: T): boolean
  removeListener (callback: T): void
}

/** Fired when a message is sent from another part of the extension. */
export const onMessage: Event<(message: any, sender: {}, sendResponse: (response: any) => void) => boolean | void>
