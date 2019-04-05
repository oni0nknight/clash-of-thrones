import React, { useState, useEffect, useContext, useCallback, useRef } from 'react'
import { Redirect } from 'react-router-dom'

import Loader from '../Loader/Loader'

import { ClientContext } from '../../context/ClientContext'
import { GameContext } from '../../context/GameContext'

const HostLobby = () => {
    const [gameName, setGameName] = useState('')
    const [redirect, setRedirect] = useState(false)

    const client = useContext(ClientContext)
    const gameContext = useContext(GameContext)

    const formRef = useRef(null)

    // Form submit handler
    const submit = useCallback((e) => {
        e.preventDefault()

        // Add class to validate the form
        formRef.current.classList.add('was-validated')

        // Check validity of the form
        if (formRef.current.checkValidity()) {
            client.query('createGame', gameName).then((game) => {
                // Update the game context
                gameContext.gameId = game.id

                // Redirect to next page
                setRedirect(true)
            }).catch((error) => {
                console.error(error)
            })
        }
    }, [gameName])

    return (
        <>
            <form ref={formRef} id="host-lobby-form" className='state' noValidate>
                <div className="form-group">
                    <label htmlFor="gameName">Game name</label>
                    <input
                        id="gameName"
                        type="text"
                        className="form-control"
                        placeholder="Game name"
                        value={gameName}
                        onChange={e => setGameName(e.target.value)}
                        required
                    />
                    <div className="invalid-feedback">Please choose a name.</div>
                </div>
                <button className="btn btn-primary" onClick={submit}>Create</button>
            </form>
            {redirect && <Redirect to={'/wait'} push={true} />}
        </>
    )
}

export default HostLobby