import Websocket from 'ws'

export function parseMessage(message: any) {
    try { return JSON.parse(message) }
    catch (exception) { return undefined }
}

export function send(conn: Websocket, data: any) {
    conn.send(JSON.stringify(data))
}