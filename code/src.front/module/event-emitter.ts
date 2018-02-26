export class EventEmitter {
  eventHandlers: {
    [key: string]: Function[]
  }


  constructor(){
    this.eventHandlers = {}
  }

  on (eventName: string, handler: Function) {
    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = []
    }
    this.eventHandlers[eventName].push(handler)
  }


  emit (eventName: string, ...args: any[]) {
    if (!this.eventHandlers[eventName]) {
      return
    }
    for (var i = 0; i < this.eventHandlers[eventName].length; i++) {
      this.eventHandlers[eventName][i].apply(null, Array.prototype.slice.call(arguments, 1))
    }
  }

  removeEventListener (eventName: string, handler: Function) {
    if (!this.eventHandlers[eventName]) {
      return
    }
    for (var i = 0; i < this.eventHandlers[eventName].length; i++) {
      if (this.eventHandlers[eventName][i] === handler) {
        this.eventHandlers[eventName].splice(i, 1)
      }
    }
  }

}