'use strict'

const helpers = require('./Helpers')
const Logger = require('../Logger/Logger')

const Game = require('../GameElements/Game')

const gameParams = {
    width: 7,
    height: 7,
    startUnitCount: 8
}

const bindSocket = (io, socket, players, games) => {
    
    socket.on('startGame', () => {
        Logger.log(socket.id, 'requesting to start game')
        const context = getReqContext(socket, players, games)
        if (!context) {
            return
        }
        if (context.gameStarted) {
            helpers.sendError(socket, '1101')
            return
        }

        // player must be host to perform this action
        if (context.game.playerId === socket.id) {
            Logger.log(socket.id, 'starting game')

            const hostPlayer = players[context.game.playerId]
            const joinedPlayer = players[context.game.joinedPlayerId]
            const gameConfig = {
                width: gameParams.width,
                height: gameParams.height,
                player1Faction: hostPlayer.faction,
                player2Faction: joinedPlayer.faction,
                startUnitCount: gameParams.startUnitCount
            }
            context.game.gameInstance = new Game(gameConfig)
            updateGameState(context.game, players)
        } else {
            helpers.sendError(socket, '1102')
        }
    })

    socket.on('removeUnit', ({uuid}) => {
        Logger.log(socket.id, 'requesting to remove unit')
        const context = getReqContext(socket, players, games)
        if (!context) {
            return
        }
        if (!context.isMyTurn) {
            helpers.sendError(socket, '1005')
            return
        }
        if (!context.gameStarted) {
            helpers.sendError(socket, '1006')
            return
        }
        Logger.log(socket.id, 'removing unit', uuid)

        if (isHost(socket, context.game, players)) {
            context.game.gameInstance.field1.removeUnit(uuid)
        }
        else {
            context.game.gameInstance.field2.removeUnit(uuid)
        }
        updateGameState(context.game, players)
    })

    socket.on('moveUnit', ({uuid, newColId}) => {
        Logger.log(socket.id, 'requesting to move unit')
        const context = getReqContext(socket, players, games)
        if (!context) {
            return
        }
        if (!context.isMyTurn) {
            helpers.sendError(socket, '1005')
            return
        }
        if (!context.gameStarted) {
            helpers.sendError(socket, '1006')
            return
        }
        Logger.log(socket.id, 'moving unit', uuid)

        const field = isHost(socket, context.game, players) ? context.game.gameInstance.field1 : context.game.gameInstance.field2
        const changes = field.moveUnit(uuid, newColId)

        if (!changes.length) {
            Logger.warn(socket.id, 'this move isn\'t allowed')
        }

        updateGameState(context.game, players)
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
        const gameConfig = {
            width: gameParams.width,
            height: gameParams.height,
            player1Faction: hostPlayer.faction,
            player2Faction: joinedPlayer.faction,
            startUnitCount: gameParams.startUnitCount
        }
        context.game.gameInstance = new Game(gameConfig)
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
        helpers.sendError(socket, '0001')
        return null
    }

    const game = games.find(g => g.id === players[socket.id].gameId)

    // check if player is in a game
    if (!game) {
        helpers.sendError(socket, '1003')
        return null
    }

    // check if the game is complete
    if (!game.playerId || !game.joinedPlayerId || !players[game.joinedPlayerId]) {
        helpers.sendError(socket, '1004')
        return null
    }

    const gameStarted = !!game.gameInstance
    let isMyTurn = false
    if (gameStarted) {
        isMyTurn = (
            (game.gameInstance.turn === 'field1' && socket.id === game.playerId) ||
            (game.gameInstance.turn === 'field2' && socket.id === game.joinedPlayerId)
        )
    }

    return { game, gameStarted, isMyTurn }
}

/**
 * Generate a new up-to-date state for the given game, and push it to the 2 client players
 * @param {GameObj} game the game for which we want to update the state
 * @param {Object.<string, PlayerObj>} players all players
 */
const updateGameState = (game, players) => {
    if (game && game.gameInstance) {
        Logger.log('default', 'pushing new game state for the 2 players')
        const gameState = game.gameInstance.serialize()

        // send the game state to the 2 players
        players[game.playerId].socket.emit('gameState_push', gameState)
        players[game.joinedPlayerId].socket.emit('gameState_push', gameState)
    }
}

const isHost = (socket, game, players) => {
    return players[socket.id].gameId === game.id && game.playerId === socket.id
}

module.exports = {
    bindSocket
}
