'use strict'

const helpers = require('./Helpers')
const Logger = require('../Logger/Logger')
const gameData = require('../../assets/data.json')

module.exports = class QueriesHandler {
    constructor(io, socket, players, games) {
        this.io = io
        this.socket = socket
        this.players = players
        this.games = games
    }

    bindSockets() {
        this.getPendingGames = this.getPendingGames.bind(this)
        this.getFactions = this.getFactions.bind(this)
        this.getPlayers = this.getPlayers.bind(this)
        this.getGameState = this.getGameState.bind(this)

        this.socket.on('pendingGames', this.getPendingGames)
        this.socket.on('factions', this.getFactions)
        this.socket.on('players', this.getPlayers)
        this.socket.on('gameState', this.getGameState)
    }


    // Socket functions
    //===================================

    getPendingGames() {
        Logger.log(this.socket.id, 'requesting pending games')
        const pendingGames = this.games.filter(g => !g.joinedPlayerId).map(g => {
            return {
                id: g.id,
                gameName: g.gameName,
                playerName: g.playerName
            }
        })

        this.socket.emit('pendingGames_response', pendingGames)
    }

    getFactions() {
        Logger.log(this.socket.id, 'requesting factions')
        this.socket.emit('factions_response', gameData.factions)
    }

    getPlayers() {
        Logger.log(this.socket.id, 'requesting players')
        const data = Object.values(this.players).map(pl => ({name: pl.name, faction: pl.faction, playing: !!pl.gameId}))
        this.socket.emit('factions_response', data)
    }

    getGameState() {
        Logger.log(this.socket.id, 'requesting game state')
        const context = this.getReqContext()
        if (!context) {
            return
        }

        if (context.gameStarted) {
            Logger.log(this.socket.id, 'fetching game state')

            const gameState = context.game.gameInstance.serialize()
            this.socket.emit('gameState_response', { gameState, changes: [] })
        }
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
    
        const gameStarted = !!game.gameInstance
    
        return { game, gameStarted }
    }
}