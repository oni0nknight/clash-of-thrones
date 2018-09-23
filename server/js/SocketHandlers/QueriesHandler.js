'use strict'

const helpers = require('./Helpers')
const Logger = require('../Logger/Logger')
const gameData = require('../../assets/data.json')

const bindSocket = (socket, players, games) => {

    socket.on('pendingGames', () => {
        Logger.log(socket.id, 'requesting pending games')
        const pendingGames = games.filter(g => g.joinedPlayerId == null).map(g => {
            return {
                id: g.id,
                gameName: g.gameName,
                playerName: g.playerName
            }
        })

        socket.emit('pendingGames_response', pendingGames)
    })

    socket.on('factions', () => {
        Logger.log(socket.id, 'requesting factions')
        socket.emit('factions_response', gameData.factions)
    })

    socket.on('players', () => {
        Logger.log(socket.id, 'requesting players')
        const data = Object.values(players).map(pl => ({name: pl.name, faction: pl.faction, playing: !!pl.gameId}))
        socket.emit('factions_response', data)
    })

    socket.on('gameState', () => {
        Logger.log(socket.id, 'requesting game state')
        const context = getReqContext(socket, players, games)
        if (!context) {
            return
        }

        if (context.gameStarted) {
            Logger.log(socket.id, 'fetching game state')
            
            const gameState = context.game.gameInstance.serialize()
            socket.emit('gameState_response', gameState)
        }
    })
}


/**
 * Returns the request context if the request is valid, null otherwise. It also displays server logs if there are errors
 * @param {socket} socket
 * @param {Object.<string, PlayerObj>} players all players
 * @param {Array.<GameObj>} games array of all games
 * @returns {object} the context
 */
const getReqContext = (socket, players, games) => {
    // check if player exists
    if (!players[socket.id]) {
        helpers.sendError(socket, 'Player must be registered to use this feature')
        return null;
    }

    const game = games.find(g => g.id === players[socket.id].gameId)

    // check if player is in a game
    if (!game) {
        helpers.sendError(socket, 'Must host or join a game first')
        return null
    }

    const gameStarted = !!game.gameInstance

    return { game, gameStarted }
}

module.exports = {
    bindSocket
}