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
        if (!requestValid(socket, players, games)) {
            return;
        }
        Logger.log(socket.id, 'fetching game state')

        const game = getCurrentGame(socket, players, games)

        // player must be host to perform this action
        if (game && game.gameInstance) {
            // send the game state to the 2 players
            const gameState = game.gameInstance.serialize()
            socket.emit('gameState_response', gameState)
        }
    })
}

const getCurrentGame = (socket, players, games) => {
    return games.find(g => g.id === players[socket.id].gameId)
}

const requestValid = (socket, players, games) => {
    // check if player exists
    if (!players[socket.id]) {
        helpers.sendError(socket, 'Player must be registered to use this feature')
        return false;
    }

    const game = getCurrentGame(socket, players, games)

    // check if player is in a game
    if (!players[socket.id].gameId || !game) {
        helpers.sendError(socket, 'Must host or join a game first')
        return false
    }

    return true
}

module.exports = {
    bindSocket
}