'use strict'

const helpers = require('./Helpers')

const Game = require('../GameElements/Game')

const bindSocket = (socket, players, games) => {
    
    socket.on('startGame', () => {
        if (!players[socket.id]) {
            helpers.sendError(socket, 'Player must be registered to use this feature')
            return;
        }
        helpers.serverLog(socket.id, 'requesting to start game')
        if (players[socket.id].gameId != null) {
            const game = games.find(g => g.id === players[socket.id].gameId)

            if (game && game.playerId === socket.id && game.joinedPlayerId != null && players[game.joinedPlayerId]) {
                const hostPlayer = players[socket.id]
                const joinedPlayer = players[game.joinedPlayerId]
                
                // initialize game
                const gameObj = new Game(7, 6, hostPlayer.faction, joinedPlayer.faction, 8)

                // generate game state & set it to game.lastGameState
                const gameState = gameObj.serialize()
                game.lastGameState = gameState

                // send the game state to the 2 players
                socket.emit('gameState', gameState)
                joinedPlayer.socket.emit('gameState', gameState)
            }
        } else {
            helpers.sendError(socket, 'Must host or join a game first')
        }
    })
}

module.exports = {
    bindSocket
}
