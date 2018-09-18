'use strict'

const helpers = require('./Helpers')
const Logger = require('../Logger/Logger')

const bindSocket = (socket, players, games) => {

    socket.on('createGame', (gameName) => {
        Logger.log(socket.id, 'requesting to create game ' + gameName)
        if (!requestValid(socket, players, games)) {
            return;
        }

        if (players[socket.id].gameId == null) {
            // create the game
            const game = {
                id: helpers.generateUUID(),
                playerId: socket.id,
                playerName: players[socket.id].name,
                gameName: gameName,
                joinedPlayerId: null,
                gameInstance: null
            }

            // add it to games list
            games.push(game)

            // add a reference to it in player structure
            players[socket.id].gameId = game.id
        }
        else {
            helpers.sendError(socket, 'Cannot create a game. You already are registered in a game.')
        }
    })

    socket.on('joinGame', (gameId) => {
        Logger.log(socket.id, 'requesting to join game ' + gameId)
        if (!requestValid(socket, players, games)) {
            return;
        }

        const game = games.find(g => g.id === gameId)
        if (game && !hasGame(socket, players) && game.playerId != null && players[game.playerId])
        {
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

    socket.on('destroyGame', () => {
        Logger.log(socket.id, 'requesting to destroy game')
        if (!requestValid(socket, players, games)) {
            return;
        }

        destroyGame(socket, players, games)
    })
}

const destroyGame = (socket, players, games) => {
    if (hasGame(socket, players))
    {
        // retrieve game infos before removing
        const game = games.find(g => g.id === players[socket.id].gameId)

        if (game && game.playerId === socket.id) {
            Logger.log(socket.id, 'destroying game ' + game.gameName)

            // remove game from games list
            games.splice(games.indexOf(game), 1)

            // remove the reference in player structure
            players[socket.id].gameId = null

            // Notify both players that the game is destroyed
            socket.emit('gameDestroyed')
            if (game.joinedPlayerId != null && players[game.joinedPlayerId]) {
                players[game.joinedPlayerId].socket.emit('gameDestroyed')
            }

            Logger.log(socket.id, 'new games list : ')
            Logger.log(socket.id, games)
        } else {
            helpers.sendError(socket, 'You do not have the permission required for this action')
        }
    }
}

const requestValid = (socket, players, games) => {
    // check if player exists
    if (!players[socket.id]) {
        helpers.sendError(socket, 'Player must be registered to use this feature')
        return false;
    }
    return true
}

const hasGame = (socket, players) => {
    return players[socket.id].gameId != null
}

module.exports = {
    bindSocket,
    destroyGame
}
