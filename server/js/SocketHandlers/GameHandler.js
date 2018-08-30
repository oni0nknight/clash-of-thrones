'use strict'

const helpers = require('./Helpers')

const bindSocket = (socket, players, games) => {

    socket.on('createGame', (gameName) => {
        if (!players[socket.id]) {
            helpers.sendError(socket, 'Player must be registered to use this feature')
            return;
        }
        helpers.serverLog(socket.id, 'requesting to create game ' + gameName)
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
    })

    socket.on('joinGame', (gameId) => {
        if (!players[socket.id]) {
            helpers.sendError(socket, 'Player must be registered to use this feature')
            return;
        }
        helpers.serverLog(socket.id, 'requesting to join game ' + gameId)
        const game = games.find(g => g.id === gameId)
        if (game && players[socket.id].gameId == null && game.playerId != null && players[game.playerId]) {
            // join the game
            game.joinedPlayerId = socket.id
            players[socket.id].gameId = game.id
            
            // notify both players that the game is ready
            socket.emit('gameReady')
            players[game.playerId].socket.emit('gameReady')
        } else {
            helpers.sendError(socket, 'Error while joining game')
        }
    })

    socket.on('destroyGame', () => {
        if (!players[socket.id]) {
            helpers.sendError(socket, 'Player must be registered to use this feature')
            return;
        }
        helpers.serverLog(socket.id, 'requesting to destroy game')
        destroyGame(socket, players, games)
    })
}

const destroyGame = (socket, players, games) => {
    if (players[socket.id].gameId != null)
    {
        // retrieve game infos before removing
        const game = games.find(g => g.id === players[socket.id].gameId)

        if (game && game.playerId === socket.id) {
            helpers.serverLog(socket.id, 'destroying game ' + game.gameName)

            // remove game from games list
            games.splice(games.indexOf(game), 1)

            // remove the reference in player structure
            players[socket.id].gameId = null

            // Notify both players that the game is destroyed
            socket.emit('gameDestroyed')
            if (game.joinedPlayerId != null && players[game.joinedPlayerId]) {
                players[game.joinedPlayerId].socket.emit('gameDestroyed')
            }

            helpers.serverLog(socket.id, 'new games list : ')
            helpers.serverLog(socket.id, games)
        } else {
            helpers.sendError(socket, 'You do not have the permission required for this action')
        }
    }
}

module.exports = {
    bindSocket,
    destroyGame
}
