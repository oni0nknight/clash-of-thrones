'use strict'

const errors =
{
    // Authorization & Players
    //=============================================

    '0001' : 'Unauthorized. Register as a player to use this feature.',
    '0002' : 'Cannot register player. Wrong name or faction.',

    // Games
    //=============================================
    
    // General errors
    '1001' : 'Cannot create a game. You are already in a game.',
    '1002' : 'Cannot join a game. The game you try to join is unavailable or corrupted.',
    '1003' : 'Unauthorized. You must be in a game for this action.',
    '1004' : 'Your game is not complete. Wait for another player to join.',

    // Start game
    '1101' : 'Cannot start the game. The game is already started.',
    '1102' : 'Cannot start the game. You must be host to start the game',
}

function get(errorCode) {
    return errors[errorCode] ? errors[errorCode] : 'Unhandled error'
}

module.exports = {
    get
}