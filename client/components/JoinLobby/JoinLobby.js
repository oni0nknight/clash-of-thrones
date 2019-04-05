import React, { useState, useEffect, useContext, useCallback, useRef } from 'react'
import { Redirect } from 'react-router-dom'

import { ClientContext } from '../../context/ClientContext'
import { GameContext } from '../../context/GameContext'

const JoinLobby = () => {
    const [pendingGames, setPendingGames] = useState([])
    const [pendingGameId, setPendingGameId] = useState('')
    const [redirect, setRedirect] = useState(false)

    const client = useContext(ClientContext)
    const gameContext = useContext(GameContext)

    const formRef = useRef(null)

    useEffect(() => {
        const refreshPendingGames = () => {
            // Fetch all pending games from the server
            return client.query('pendingGames').then((games) => {
                // Set the list of pending games
                setPendingGames(games)
            })
        }

        // Initialize the pending games list
        refreshPendingGames().then(() => {
            // Set the currently selected game
            const initGameId = gameContext.gameId || (pendingGames[0] && pendingGames[0].id) || ''
            setPendingGameId(initGameId)
        })

        // Subscribe to game list updates
        client.subscribe('gameListUpdated', refreshPendingGames)
        return () => {
            client.unsubscribe('gameListUpdated', refreshPendingGames)
        }
    }, [])

    // Form submit handler
    const submit = useCallback((e) => {
        e.preventDefault()

        // Add class to validate the form
        formRef.current.classList.add('was-validated')

        // Check validity of the form
        if (formRef.current.checkValidity()) {
            // If valid, update the game context
            gameContext.gameId = pendingGameId

            client.query('joinGame', pendingGameId).then(() => {
                // Redirect to next page
                setRedirect(true)
            }).catch((error) => {
                console.error(error)
            })
        }
    }, [pendingGameId])

    return (
        <>
            <form ref={formRef} id="join-lobby-form" className='state' noValidate>
                <div className="form-group">
                    <label htmlFor="gameSelect">Select a game</label>
                    <select className="form-control" id="gameSelect" value={pendingGameId} onChange={e => setPendingGameId(e.target.value)} required>
                        {pendingGames.map((game, idx) => {
                            return <option key={idx} value={game.id}>{game.gameName}</option>
                        })}
                    </select>
                    <div className="invalid-feedback">Please choose a game to join.</div>
                </div>
                <button className="btn btn-primary" onClick={submit}>Join game</button>
            </form>
            {redirect && <Redirect to='/game' push={true} />}
        </>
    )
}

export default JoinLobby