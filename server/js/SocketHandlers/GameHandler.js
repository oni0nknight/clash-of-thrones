'use strict'

const helpers = require('./Helpers')
const Logger = require('../Logger/Logger')

module.exports = class GameHandler {
    constructor(io, socket, players, games) {
        this.io = io
        this.socket = socket
        this.players = players
        this.games = games
    }

    bindSockets() {
        this.joinGame = this.joinGame.bind(this)
        this.leaveGame = this.leaveGame.bind(this)

        this.socket.on('joinGame', this.joinGame)
        this.socket.on('leaveGame', this.leaveGame)
    }


    // Socket functions
    //===================================

    joinGame(gameId) {
        Logger.log(this.socket.id, 'requesting to join game ' + gameId)
        const context = this.getReqContext()
        if (!context) {
            return
        }

        const game = this.games.find(g => g.id === gameId)
        if (game && !this.hasGame() && game.playerId !== null && this.players[game.playerId])
        {
            Logger.log(this.socket.id, 'joining the game ' + gameId)

            // join the game
            game.joinedPlayerId = this.socket.id
            this.players[this.socket.id].gameId = game.id
            
            // notify both players that the game is ready
            this.socket.emit('gameReady')
            this.players[game.playerId].socket.emit('gameReady')
        }
        else {
            helpers.sendError(this.socket, '1002')
        }
    }

    leaveGame() {
        Logger.log(this.socket.id, 'requesting to leave game')
        const context = this.getReqContext()
        if (!context) {
            return
        }
        Logger.log(this.socket.id, 'leaving game')
    
        this.destroyGame()
    }

    
    // Helpers
    //===================================

    /**
     * Returns the request context if the request is valid, null otherwise. It also displays server logs if there are errors
     * @returns {object} the context
     */
    getReqContext() {
        // check if player exists
        if (!this.players[this.socket.id]) {
            helpers.sendError(this.socket, '0001')
            return null
        }
    
        return {}
    }

    hasGame() {
        return this.players[this.socket.id].gameId !== null
    }

    destroyGame() {
        const game = this.games.find(g => g.id === this.players[this.socket.id].gameId)
    
        if (game) {
            Logger.log(this.socket.id, 'destroying game ' + game.gameName)
    
            // remove game from games list
            this.games.splice(this.games.indexOf(game), 1)
    
            // remove the reference in player structure & notify them
            if (game.playerId !== null && this.players[game.playerId]) {
                this.players[game.playerId].gameId = null
                this.players[game.playerId].socket.emit('gameDestroyed')
            }
            if (game.joinedPlayerId !== null && this.players[game.joinedPlayerId]) {
                this.players[game.joinedPlayerId].gameId = null
                this.players[game.joinedPlayerId].socket.emit('gameDestroyed')
            }
    
            Logger.log(this.socket.id, 'new games list : ')
            Logger.log(this.socket.id, this.games)
    
            // notify all the players
            this.io.emit('gameListUpdated')
        }
    }
}

