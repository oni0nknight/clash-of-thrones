import io from 'socket.io-client'

export default class Client {
    constructor(game) {
        this.socket = null
        this.game = game
    }

    connect() {
        this.socket = io.connect()
    
        this.socket.on('registered', message => {
            document.getElementById('title').innerHTML = 'registered !!'
        })
    }

    registerPlayer(playerName, playerColor) {
        this.socket.emit('register', {
            playerName, 
            playerColor
        })
    }
}