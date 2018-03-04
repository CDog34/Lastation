export class Logger {
  wrapper: HTMLElement
  constructor (ele: HTMLElement) {
    this.wrapper = ele
  }

  private createLogNode (logContent: string) {
    const newNode = document.createElement('p')
    newNode.className = 'log-item'
    const span = document.createElement('span')
    span.className = 'log-time'
    span.innerText = (new Date()).toLocaleTimeString() + ': '
    newNode.appendChild(span)
    newNode.appendChild(document.createTextNode(logContent))
    return newNode
  }

  public log (...args: any[]) {
    this.wrapper.appendChild(this.createLogNode(
      args.map(item => {
        if (typeof item === 'object') {
          return JSON.stringify(item)
        }
        return item
      }).join(' ')
    ))
    this.wrapper.scrollTop = this.wrapper.scrollHeight - this.wrapper.clientHeight
  }
}