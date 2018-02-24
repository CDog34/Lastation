import { EventEmitter } from 'events'
import { WSSession } from './wss.session'

export class Room extends EventEmitter {
  public roomId: number

  static roomMap: {
    [key: string]: Room
  } = {}

  static addSessionToRoom (roomId: number, wsSession: WSSession) {
    const roomIdStr = roomId + ''
    let roomInstance = Room.roomMap[roomIdStr]
    if (!roomInstance) {
      roomInstance = new Room(roomId)
      Room.roomMap[roomIdStr] = roomInstance
    }
    roomInstance.addSessionToInstance(wsSession)
  }

  static sendMessage (roomId: number, cnt: any) {
    const roomIdStr = roomId + ''
    const roomInstance = Room.roomMap[roomIdStr]
    if (!roomInstance) {
      throw new Error('Room not exist')
    }
    roomInstance.sendMessage(cnt)
  }

  private constructor (roomId: number) {
    super()
    this.roomId = roomId
  }

  private addSessionToInstance (wsSession: WSSession) {
    if (wsSession.roomId === this.roomId) {
      const handler = (cnt: any) => {
        process.nextTick(() => {
          wsSession.send(cnt)
        })
      }
      this.on('message', handler)
      wsSession.on('end', () => {
        this.removeListener('message', handler)
      })
    }
  }

  public sendMessage (cnt: any) {
    this.emit('message', cnt)
  }
}