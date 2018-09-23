'use strict'

const helpers = require('./Helpers')
const Logger = require('../Logger/Logger')

const Game = require('../GameElements/Game')

const bindSocket = (socket, players, games) => {
    
    socket.on('startGame', () => {
        Logger.log(socket.id, 'requesting to start game')
        if (!requestValid(socket, players, games)) {
            return;
        }
        Logger.log(socket.id, 'starting game')

        const game = getCurrentGame(socket, players, games)

        // player must be host to perform this action
        if (game.playerId === socket.id) {
            const hostPlayer = players[socket.id]
            const joinedPlayer = players[game.joinedPlayerId]
            
            // initialize game
            const gameObj = new Game(7, 7, hostPlayer.faction, joinedPlayer.faction, 8)
    
            // keep track of it in game structure
            game.gameInstance = gameObj
        } else {
            helpers.sendError(socket, 'You do not have the permission required for this action')
        }
    })

    socket.on('changeTurn', () => {
        Logger.log(socket.id, 'requesting to change turn')
        if (!requestValid(socket, players, games)) {
            return;
        }
        Logger.log(socket.id, 'changing turn')

        const game = getCurrentGame(socket, players, games)
        game.gameInstance.changeTurn()
    })
}

const isMyTurn = (socket, game) => {
    return (!game.gameInstance) || (game.gameInstance.turn === 1 && game.playerId === socket.id) || (game.gameInstance.turn === 2 && game.joinedPlayerId === socket.id)
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

    // check if the game is complete
    if (game.playerId == null || game.joinedPlayerId == null || !players[game.joinedPlayerId]) {
        helpers.sendError(socket, 'Game is not complete')
        return false
    }

    // check if it is the player's turn
    if (!isMyTurn(socket, game)) {
        helpers.sendError(socket, 'It is not your turn to play')
        return false
    }

    return true
}

const updateGameState = (players, game) => {
    if (game && game.gameInstance) {
        const gameState = game.gameInstance.serialize()

        // send the game state to the 2 players
        players[game.playerId].socket.emit('gameState_push', gameState)
        players[game.joinedPlayerId].socket.emit('gameState_push', gameState)
    }
}

module.exports = {
    bindSocket
}
