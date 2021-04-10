import http from 'http'
import Websocket from 'ws'

export const auth = (server: http.Server, wss: Websocket.Server) => {
    function authenticate(req: any, callback: (err?: Error) => void) {
        //authenticate req
        callback()
    }

    server.on('upgrade', async function upgrade(request, socket, head) {
        authenticate(request, err => {
            if (err) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
                socket.destroy()
                return
            }

            // wss.handleUpgrade(request, socket, head, function done(ws) {
            //     wss.emit('connection', ws, request)
            // })
        })
    })
}