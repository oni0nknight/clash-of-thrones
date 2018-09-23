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
            const hostPlayer = players[game.playerId]
            const joinedPlayer = players[game.joinedPlayerId]
            
            // initialize game
            game.gameInstance = new Game(7, 7, hostPlayer.faction, joinedPlayer.faction, 8)
        } else {
            helpers.sendError(socket, 'You do not have the permission required for this action')
        }
    })


    // DEBUG COMMANDS
    //=======================================

    socket.on('changeTurn', () => {
        Logger.log(socket.id, 'requesting to change turn')
        if (!requestValid(socket, players, games)) {
            return;
        }
        Logger.log(socket.id, 'changing turn')

        const game = getCurrentGame(socket, players, games)
        game.gameInstance.changeTurn()
        updateGameState(players, game)
    })

    socket.on('resetGame', () => {
        Logger.log(socket.id, 'requesting to reset game')
        if (!requestValid(socket, players, games)) {
            return;
        }
        Logger.log(socket.id, 'reseting game')

        const game = getCurrentGame(socket, players, games)
        const hostPlayer = players[game.playerId]
        const joinedPlayer = players[game.joinedPlayerId]
        
        // re-initialize game
        game.gameInstance = new Game(7, 7, hostPlayer.faction, joinedPlayer.faction, 8)
        updateGameState(players, game)
    })
}

/**
 * return true if it is the player's turn. false otherwise
 * @param {socket} socket
 * @param {GameObj} game the current game
 * @returns {Boolean}
 */
const isMyTurn = (socket, game) => {
    return (!game.gameInstance) || (game.gameInstance.turn === 1 && game.playerId === socket.id) || (game.gameInstance.turn === 2 && game.joinedPlayerId === socket.id)
}

/**
 * Get the current game of the player. If not in a game, return null
 * @param {socket} socket
 * @param {Object.<string, PlayerObj>} players all players
 * @param {Array.<GameObj>} games array of all games
 * @returns {GameObj} the game of the player
 */
const getCurrentGame = (socket, players, games) => {
    return games.find(g => g.id === players[socket.id].gameId)
}

/**
 * Returns true if the request is valid, false otherwise. It also displays server logs if there is an error
 * @param {socket} socket
 * @param {Object.<string, PlayerObj>} players all players
 * @param {Array.<GameObj>} games array of all games
 * @returns {Boolean}
 */
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

/**
 * Generate a new up-to-date state for the given game, and push it to the 2 client players
 * @param {Object.<string, PlayerObj>} players all players
 * @param {GameObj} game the game for which we want to update the state
 */
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
