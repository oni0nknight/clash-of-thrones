'use strict'

const helpers = require('./Helpers')
const Logger = require('../Logger/Logger')

const Game = require('../GameElements/Game')

const bindSocket = (socket, players, games) => {
    
    socket.on('startGame', () => {
        Logger.log(socket.id, 'requesting to start game')
        const context = getReqContext(socket, players, games)
        if (!context) {
            return
        }
        if (context.gameStarted) {
            helpers.sendError(socket, 'Game already created')
            return
        }

        // player must be host to perform this action
        if (context.game.playerId === socket.id) {
            Logger.log(socket.id, 'starting game')
            
            const hostPlayer = players[context.game.playerId]
            const joinedPlayer = players[context.game.joinedPlayerId]
            context.game.gameInstance = new Game(7, 7, hostPlayer.faction, joinedPlayer.faction, 8)
            updateGameState(context.game, players)
        } else {
            helpers.sendError(socket, 'You must be host to start the game')
        }
    })


    // DEBUG COMMANDS
    //=======================================

    socket.on('resetGame', () => {
        Logger.log(socket.id, 'requesting to reset game')
        const context = getReqContext(socket, players, games)
        if (!context) {
            return
        }
        Logger.log(socket.id, 'reseting game')
        
        // re-initialize game
        const hostPlayer = players[context.game.playerId]
        const joinedPlayer = players[context.game.joinedPlayerId]
        context.game.gameInstance = new Game(7, 7, hostPlayer.faction, joinedPlayer.faction, 8)
        updateGameState(context.game, players)
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

    // check if the game is complete
    if (game.playerId == null || game.joinedPlayerId == null || !players[game.joinedPlayerId]) {
        helpers.sendError(socket, 'Game is not complete')
        return null
    }

    const gameStarted = !!game.gameInstance
    const isMyTurn = gameStarted && ((game.gameInstance.turn === 1 && game.playerId === socket.id) || (game.gameInstance.turn === 2 && game.joinedPlayerId === socket.id))

    return { game, gameStarted, isMyTurn }
}

/**
 * Generate a new up-to-date state for the given game, and push it to the 2 client players
 * @param {GameObj} game the game for which we want to update the state
 * @param {Object.<string, PlayerObj>} players all players
 */
const updateGameState = (game, players) => {
    if (game && game.gameInstance) {
        Logger.log('X', 'pushing new game state for the 2 players')
        const gameState = game.gameInstance.serialize()

        // send the game state to the 2 players
        players[game.playerId].socket.emit('gameState_push', gameState)
        players[game.joinedPlayerId].socket.emit('gameState_push', gameState)
    }
}

module.exports = {
    bindSocket
}
