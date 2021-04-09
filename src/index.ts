import http from 'http'
import express from 'express'
import Websocket from 'ws'

import { auth } from './authentication'
import { parseMessage, send } from './utils'

const app = express()
const server = http.createServer(app)
const wss = new Websocket.Server({ server })

type client = { user_id: string, conn: Websocket }
const rooms: Record<string, client[]> = {}

auth(server, wss)

wss.on("connection", (conn) => {

  conn.on("message", (data) => {
    const info = parseMessage(data)

    if (info) {
      switch (info.command) {
        case 'connect': {
          if (info.roomId && info.user_id) {
            if (rooms[info.roomId]) {
              if (rooms[info.roomId].length !== 2) {
                rooms[info.roomId].push({
                  user_id: info.user_id,
                  conn
                })
              } else send(conn, { event: "this room already contains users" })
            } else rooms[info.roomId] = [{
              user_id: info.user_id,
              conn
            }]
          } else send(conn, { event: "either the roomId or userId is missing" })
          break
        }
        case 'offer': {
          const { sdp, roomId } = info
          const receiver_conn = rooms[roomId].find(client => client.conn !== conn)?.conn
          if (receiver_conn) send(receiver_conn, { event: "offer", sdp })
          else send(conn, { event: "no receiver was found" })
          break
        }
        case 'answer': {
          const { sdp, roomId } = info
          const caller_conn = rooms[roomId].find(client => client.conn !== conn)?.conn
          if (caller_conn) send(caller_conn, { event: "answer", sdp })
          else send(conn, { event: "no caller was found" })
          break;
        }
        case 'iceCandidateProposal': {
          const { ice, roomId } = info
          const caller_conn = rooms[roomId].find(client => client.conn !== conn)?.conn
          if (caller_conn) send(caller_conn, { event: "iceCandidateProposal", ice })
          else send(conn, { event: "no receiver was found" })
          break;
        }
      }
    } else {
      send(conn, { event: "empty query was recieved" })
    }
  })

  conn.on("close", () => {
    Object.entries(rooms).forEach(([room, clients]) => {
      clients.forEach(client => {
        if (client.conn === conn) {
          rooms[room] = clients.filter(client => {
            return client.conn !== conn
          })
        }
      })
      if (rooms[room].length === 0) delete rooms[room]
    })
  })

})

server.listen(5005)