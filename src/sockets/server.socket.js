import {Server} from 'socket.io';

let io;
export const initSocketServer = (httpserver) => {
    io = new Server(httpserver, {
        cors: {
            origin: 'https://nex-chat-frontend-phi.vercel.app',
            credentials: true,
        },
    })

    console.log('Socket Sever Active')

    io.on('connection', (socket) => {
        console.log('a user connected' + socket.id);
    });
};


export function getIo() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }

    return io;

}