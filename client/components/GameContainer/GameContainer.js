import React, { useState, useEffect, useContext } from 'react'
import { Redirect } from 'react-router-dom'

import { ClientContext } from '../../context/ClientContext'
import { GameContext } from '../../context/GameContext'

import Game from '../../js/Game'

const GameContainer = () => {
    const [redirectPath, setRedirectPath] = useState(null)

    const client = useContext(ClientContext)
    const gameContext = useContext(GameContext)

    useEffect(() => {
        // send start game event
        if (gameContext.isHost) {
            client.call('startGame')
        }

        // Register callbacks
        const gameDestroyed = () => {
            alert('The other player left the game')
            setRedirectPath(gameContext.isHost ? '/host' : '/join')
        }

        // Create the Phaser game
        const game = new Game(client, gameContext.isHost)
        game.initialize(gameContext.playerName, gameContext.faction)

        client.subscribe('gameDestroyed', gameDestroyed)

        return () => {
            client.unsubscribe('gameDestroyed', gameDestroyed)
            game.destroy()
        }
    }, [])

    return (
        <>
            <div id="game-container" className="state"></div>
            {redirectPath !== null && <Redirect to={redirectPath} push={true} />}
        </>
    )
}

export default GameContainer