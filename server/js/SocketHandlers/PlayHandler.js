'use strict'

const helpers = require('./Helpers')
const Logger = require('../Logger/Logger')

const Game = require('../GameElements/Game')

module.exports = class PlayHandler {
    constructor(io, socket, players, games) {
        this.io = io
        this.socket = socket
        this.players = players
        this.games = games
    }

    bindSockets() {
        this.startGame = this.startGame.bind(this)
        this.removeUnit = this.removeUnit.bind(this)
        this.moveUnit = this.moveUnit.bind(this)
        this.reinforce = this.reinforce.bind(this)
        this.endTurn = this.endTurn.bind(this)
        this.resetGame = this.resetGame.bind(this)

        this.socket.on('startGame', this.startGame)
        this.socket.on('removeUnit', this.removeUnit)
        this.socket.on('moveUnit', this.moveUnit)
        this.socket.on('reinforce', this.reinforce)
        this.socket.on('endTurn', this.endTurn)

        // Debug
        this.socket.on('resetGame', this.resetGame)
    }

    
    // Socket functions
    //===================================

    startGame() {
        Logger.log(this.socket.id, 'requesting to start game')
        const context = this.getReqContext()
        if (!context) {
            return
        }
        if (context.gameStarted) {
            helpers.sendError(this.socket, '1101')
            return
        }

        // player must be host to perform this action
        if (context.game.playerId === this.socket.id) {
            Logger.log(this.socket.id, 'starting game')

            const hostPlayer = this.players[context.game.playerId]
            const joinedPlayer = this.players[context.game.joinedPlayerId]
            const gameConfig = {
                faction1: hostPlayer.faction,
                faction2: joinedPlayer.faction
            }
            context.game.gameInstance = new Game(gameConfig)
            this.updateGameState(context.game)
        } else {
            helpers.sendError(this.socket, '1102')
        }
    }

    removeUnit({ uuid }) {
        Logger.log(this.socket.id, 'requesting to remove unit')
        const context = this.getReqContext()
        if (!context) {
            return
        }
        if (!context.isMyTurn) {
            helpers.sendError(this.socket, '1005')
            return
        }
        if (!context.gameStarted) {
            helpers.sendError(this.socket, '1006')
            return
        }
        Logger.log(this.socket.id, 'removing unit', uuid)

        const field = this.getField(context.game)
        const changes = field.removeUnit(uuid)

        if (!changes.length) {
            Logger.warn(this.socket.id, 'this action isn\'t allowed')
        }

        this.updateGameState(context.game, changes)
    }

    moveUnit({ uuid, newColId }) {
        Logger.log(this.socket.id, 'requesting to move unit')
        const context = this.getReqContext()
        if (!context) {
            return
        }
        if (!context.isMyTurn) {
            helpers.sendError(this.socket, '1005')
            return
        }
        if (!context.gameStarted) {
            helpers.sendError(this.socket, '1006')
            return
        }
        Logger.log(this.socket.id, 'moving unit', uuid)

        const field = this.getField(context.game)
        const changes = field.moveUnit(uuid, newColId)

        if (!changes.length) {
            Logger.warn(this.socket.id, 'this action isn\'t allowed')
        }

        this.updateGameState(context.game, changes)
    }

    reinforce() {
        Logger.log(this.socket.id, 'requesting to reinforce')
        const context = this.getReqContext()
        if (!context) {
            return
        }
        if (!context.isMyTurn) {
            helpers.sendError(this.socket, '1005')
            return
        }
        if (!context.gameStarted) {
            helpers.sendError(this.socket, '1006')
            return
        }
        Logger.log(this.socket.id, 'reinforcing')

        const field = this.getField(context.game)
        const changes = field.reinforce()

        this.updateGameState(context.game, changes)
    }

    endTurn() {
        Logger.log(this.socket.id, 'requesting to end turn')
        const context = this.getReqContext()
        if (!context) {
            return
        }
        if (!context.isMyTurn) {
            helpers.sendError(this.socket, '1005')
            return
        }
        if (!context.gameStarted) {
            helpers.sendError(this.socket, '1006')
            return
        }
        Logger.log(this.socket.id, 'ending turn')

        const changes = context.game.gameInstance.changeTurn()

        this.updateGameState(context.game, changes)
    }

    resetGame() {
        Logger.log(this.socket.id, 'requesting to reset game')
        const context = this.getReqContext()
        if (!context) {
            return
        }
        Logger.log(this.socket.id, 'reseting game')
        
        // re-initialize game
        const hostPlayer = this.players[context.game.playerId]
        const joinedPlayer = this.players[context.game.joinedPlayerId]
        const gameConfig = {
            faction1: hostPlayer.faction,
            faction2: joinedPlayer.faction
        }
        context.game.gameInstance = new Game(gameConfig)
        this.updateGameState(context.game)
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
    
        const game = this.games.find(g => g.id === this.players[this.socket.id].gameId)
    
        // check if player is in a game
        if (!game) {
            helpers.sendError(this.socket, '1003')
            return null
        }
    
        // check if the game is complete
        if (!game.playerId || !game.joinedPlayerId || !this.players[game.joinedPlayerId]) {
            helpers.sendError(this.socket, '1004')
            return null
        }
    
        const gameStarted = !!game.gameInstance
        let isMyTurn = false
        if (gameStarted) {
            isMyTurn = (
                (game.gameInstance.turn === 'field1' && this.socket.id === game.playerId) ||
                (game.gameInstance.turn === 'field2' && this.socket.id === game.joinedPlayerId)
            )
        }
    
        return { game, gameStarted, isMyTurn }
    }

    /**
     * Generate a new up-to-date state for the given game, and push it to the 2 client players
     * @param {GameObj} game the game for which we want to update the state
     * @param {object} changes changes that lead to the new game state
     */
    updateGameState(game, changes = []) {
        if (game && game.gameInstance) {
            Logger.log('default', 'pushing new game state for the 2 players')
            const finalState = game.gameInstance.serialize()
    
            // send the game state to the 2 players
            this.players[game.playerId].socket.emit('gameState_push', { finalState, changes })
            this.players[game.joinedPlayerId].socket.emit('gameState_push', { finalState, changes })
        }
    }

    isHost(game) {
        return (
            this.players[this.socket.id].gameId === game.id &&
            game.playerId === this.socket.id
        )
    }

    getField(game) {
        return this.isHost(game) ? game.gameInstance.field1 : game.gameInstance.field2
    }
}

