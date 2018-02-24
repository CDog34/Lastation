function WSClient(roomId) {
  if (!roomId || isNaN(parseInt(roomId, 0))) {
    throw new Error('RoomId is Required.')
  }
  this.roomId = parseInt(roomId, 0)
  this.ws = null
  this.isClosed = false
  this.heartbeatInterval = null
  this.eventHandlers = {}
}
WSClient.prototype.connect = function () {
  var self = this
  this.ws = new WebSocket('ws://localhost:2233')
  this.ws.addEventListener('open', function () {
    clearInterval(this.heartbeatInterval)
    self.ws.send(JSON.stringify({
      cmd: 'handshake',
      roomId: self.roomId
    }))
  })

  this.ws.addEventListener('message', function (evt) {
    try {
      var json = JSON.parse(evt.data)
      if (json.message === 'Business Handshake OK') {
        self.startHeartbeat()
        self.emit('handshake')
      } else if (json.message === 'Push') {
        self.emit('message', json.data)
      } else if (json.message === 'Heartbeat OK') {
        self.emit('heartbeat', json.data)
      }
    } catch (err) {
      console.log(err)
    }
  })

  this.ws.addEventListener('close', function () {
    clearInterval(this.heartbeatInterval);
    !self.isClosed && self.connect()
  })

  this.ws.addEventListener('error', function () {
    clearInterval(this.heartbeatInterval);
    !self.isClosed && self.connect()
  })
}

WSClient.prototype.startHeartbeat = function () {
  var self = this
  this.heartbeatInterval = setInterval(function () {
    self.ws.send(JSON.stringify({
      cmd: 'heartbeat',
      ts: Date.now()
    }))
  }, 30 * 1000)
}

WSClient.prototype.on = function (eventName, handler) {
  if (!this.eventHandlers[eventName]) {
    this.eventHandlers[eventName] = []
  }
  this.eventHandlers[eventName].push(handler)
}

WSClient.prototype.emit = function (eventName) {
  if (!this.eventHandlers[eventName]) {
    return
  }
  for (var i = 0; i < this.eventHandlers[eventName].length; i++) {
    this.eventHandlers[eventName][i].apply(null, Array.prototype.slice.call(arguments, 1))
  }
}

WSClient.prototype.removeEventListener = function (eventName, handler) {
  if (!this.eventHandlers[eventName]) {
    return
  }
  for (var i = 0; i < this.eventHandlers[eventName].length; i++) {
    if (this.eventHandlers[eventName][i] === handler) {
      this.eventHandlers[eventName].splice(i, 1)
    }
  }
}