'use strict'

const helpers = require('./Helpers')
const dataHelpers = require('../DataHelpers')
const Logger = require('../Logger/Logger')
const gameData = require('../../assets/data.json')

let uniqueID = 0
module.exports = class QueriesHandler {
    constructor(io, socket, players, games) {
        this.io = io
        this.socket = socket
        this.players = players
        this.games = games
    }

    bindSockets() {
        this.register = this.register.bind(this)
        this.getPendingGames = this.getPendingGames.bind(this)
        this.getFactions = this.getFactions.bind(this)
        this.getPlayers = this.getPlayers.bind(this)
        this.getGameState = this.getGameState.bind(this)
        this.createGame = this.createGame.bind(this)
        this.joinGame = this.joinGame.bind(this)
        // this.leaveGame = this.leaveGame.bind(this)

        this.socket.on('register', this.register)
        this.socket.on('pendingGames', this.getPendingGames)
        this.socket.on('factions', this.getFactions)
        this.socket.on('players', this.getPlayers)
        this.socket.on('gameState', this.getGameState)
        this.socket.on('createGame', this.createGame)
        this.socket.on('joinGame', this.joinGame)
        // this.socket.on('leaveGame', this.leaveGame)
    }


    // Socket functions
    //===================================

    register(data) {
        Logger.log(this.socket.id, 'requesting to register player.')

        if (data.name && data.faction && dataHelpers.factionExists(data.faction)) {
            let playerName = data.name
            playerName += Object.keys(this.players).some(id => this.players[id].name === playerName) ? '#' + (uniqueID++).toString() : ''
            Logger.log(this.socket.id, 'Player registered with name ' + data.name + ' and faction ' + data.faction)

            this.players[this.socket.id] = {
                socket: this.socket,
                name: playerName,
                faction: data.faction,
                gameId: null
            }

            // validate the register
            this.socket.emit('register_response')
        }
        else {
            helpers.replyError(this.socket, 'register', '0002')
        }
    }

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

            const finalState = context.game.gameInstance.serialize()
            this.socket.emit('gameState_response', { finalState, changes: [] })
        }
        else {
            helpers.replyError(this.socket, 'gameState', '1007')
        }
    }

    createGame(gameName){
        Logger.log(this.socket.id, 'requesting to create game ' + gameName)
        if (!this.playerExists()) {
            helpers.replyError(this.socket, 'createGame', '0001')
            return
        }

        if (!this.hasGame()) {
            Logger.log(this.socket.id, 'creating the game ' + gameName)

            // create the game
            const game = {
                id: helpers.generateUUID(),
                playerId: this.socket.id,
                playerName: this.players[this.socket.id].name,
                gameName,
                joinedPlayerId: null,
                gameInstance: null
            }

            // add it to games list
            this.games.push(game)

            // add a reference to it in player structure
            this.players[this.socket.id].gameId = game.id

            // notify all the players
            this.io.emit('gameListUpdated')

            // validate the creation
            this.socket.emit('createGame_response', {
                id: game.id,
                gameName: game.gameName,
                playerName: game.playerName
            })
        }
        else {
            helpers.replyError(this.socket, 'createGame', '1001')
        }
    }

    joinGame(gameId) {
        Logger.log(this.socket.id, 'requesting to join game ' + gameId)
        if (!this.playerExists()) {
            helpers.replyError(this.socket, 'joinGame', '0001')
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
            this.socket.emit('joinGame_response')
            this.players[game.playerId].socket.emit('gameReady')
        }
        else {
            helpers.replyError(this.socket, 'joinGame', '1002')
        }
    }


    // Helpers
    //===================================

    /**
     * Check if the player exists
     * @returns {boolean} tells if the player exists
     */
    playerExists() {
        return !!this.players[this.socket.id]
    }

    /**
     * Returns the request context if the request is valid, null otherwise. It also displays server logs if there are errors
     * @returns {object} the context
     */
    getReqContext(query) {
        // check if player exists
        if (!this.playerExists()) {
            helpers.replyError(this.socket, query, '0001')
            return null
        }
    
        const game = this.games.find(g => g.id === this.players[this.socket.id].gameId)
    
        // check if player is in a game
        if (!game) {
            helpers.replyError(this.socket, query, '1003')
            return null
        }
    
        const gameStarted = !!game.gameInstance
    
        return { game, gameStarted }
    }

    hasGame() {
        return this.players[this.socket.id].gameId !== null
    }
}