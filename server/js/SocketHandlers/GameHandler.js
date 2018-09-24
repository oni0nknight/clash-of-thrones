'use strict'

const helpers = require('./Helpers')
const Logger = require('../Logger/Logger')

const bindSocket = (io, socket, players, games) => {

    socket.on('createGame', (gameName) => {
        Logger.log(socket.id, 'requesting to create game ' + gameName)
        const context = getReqContext(socket, players, games)
        if (!context) {
            return
        }

        if (players[socket.id].gameId === null) {
            Logger.log(socket.id, 'creating the game ' + gameName)

            // create the game
            const game = {
                id: helpers.generateUUID(),
                playerId: socket.id,
                playerName: players[socket.id].name,
                gameName,
                joinedPlayerId: null,
                gameInstance: null
            }

            // add it to games list
            games.push(game)

            // add a reference to it in player structure
            players[socket.id].gameId = game.id

            // notify all the players
            io.emit('gameListUpdated')
        }
        else {
            helpers.sendError(socket, 'Cannot create a game. You already are registered in a game.')
        }
    })

    socket.on('joinGame', (gameId) => {
        Logger.log(socket.id, 'requesting to join game ' + gameId)
        const context = getReqContext(socket, players, games)
        if (!context) {
            return
        }

        const game = games.find(g => g.id === gameId)
        if (game && !hasGame(socket, players) && game.playerId !== null && players[game.playerId])
        {
            Logger.log(socket.id, 'joining the game ' + gameId)

            // join the game
            game.joinedPlayerId = socket.id
            players[socket.id].gameId = game.id
            
            // notify both players that the game is ready
            socket.emit('gameReady')
            players[game.playerId].socket.emit('gameReady')
        }
        else {
            helpers.sendError(socket, 'Error while joining game')
        }
    })

    socket.on('leaveGame', () => {
        Logger.log(socket.id, 'requesting to leave game')
        const context = getReqContext(socket, players, games)
        if (!context) {
            return
        }
        Logger.log(socket.id, 'leaving game')
    
        destroyGame(io, socket, players, games)
    })

}


const destroyGame = (io, socket, players, games) => {
    const game = games.find(g => g.id === players[socket.id].gameId)

    if (game) {
        Logger.log(socket.id, 'destroying game ' + game.gameName)

        // remove game from games list
        games.splice(games.indexOf(game), 1)

        // remove the reference in player structure & notify them
        if (game.playerId !== null && players[game.playerId]) {
            players[game.playerId].gameId = null
            players[game.playerId].socket.emit('gameDestroyed')
        }
        if (game.joinedPlayerId !== null && players[game.joinedPlayerId]) {
            players[game.joinedPlayerId].gameId = null
            players[game.joinedPlayerId].socket.emit('gameDestroyed')
        }

        Logger.log(socket.id, 'new games list : ')
        Logger.log(socket.id, games)

        // notify all the players
        io.emit('gameListUpdated')
    }
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
        return null
    }

    return {}
}

const hasGame = (socket, players) => {
    return players[socket.id].gameId !== null
}

module.exports = {
    bindSocket,
    destroyGame
}
