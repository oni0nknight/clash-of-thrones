import React, { useState, useEffect, useContext, useCallback, useRef } from 'react'
import { Redirect } from 'react-router-dom'

import { ClientContext } from '../../context/ClientContext'
import { GameContext } from '../../context/GameContext'

const Home = () => {
    const [playerName, setPlayerName] = useState('')
    const [faction, setFaction] = useState('')
    const [redirectPath, setRedirectPath] = useState(null)
    const [factions, setFactions] = useState([])

    const client = useContext(ClientContext)
    const gameContext = useContext(GameContext)

    const formRef = useRef(null)

    useEffect(() => {
        // Fetch all factions from the server
        client.query('factions').then(allFactions => {
            // Set the list of factions
            setFactions(allFactions)

            // Set the currently selected faction
            const initFaction = gameContext.faction || (allFactions[0] && allFactions[0].id) || ''
            setFaction(initFaction)
        })

        // Init the player name from the context
        setPlayerName(gameContext.playerName)
    }, [])

    // Form submit handler
    const submit = useCallback((e) => {
        e.preventDefault()

        // Add class to validate the form
        formRef.current.classList.add('was-validated')

        // Check validity of the form
        if (formRef.current.checkValidity()) {
            // If valid, update the game context
            gameContext.playerName = playerName
            gameContext.faction = faction
            gameContext.isHost = e.target.dataset['action'] === 'host'
            const path = e.target.dataset['action']

            client.query('register', { name: playerName, faction }).then(() => {
                // Redirect to the right page
                setRedirectPath(`/${path}`)
            }).catch((error) => {
                // Redirect to the right page
                setRedirectPath('/error')
            })
        }
    }, [playerName, faction])

    return (
        <>
            <form ref={formRef} id="init-form" className='state' noValidate>
                <div className="form-group">
                    <label htmlFor="playerName">Player name</label>
                    <input
                        id="playerName"
                        type="text"
                        className="form-control"
                        placeholder="Player name"
                        value={playerName}
                        onChange={e => setPlayerName(e.target.value)}
                        required
                    />
                    <div className="invalid-feedback">Please choose a name.</div>
                </div>
                <div className="form-group">
                    <label htmlFor="factionSelect">Faction</label>
                    <select id="factionSelect" value={faction} onChange={e => setFaction(e.target.value)} className="form-control" required>
                        {factions.map((fac, idx) => {
                            return <option key={idx} value={fac.id}>{fac.id}</option>
                        })}
                    </select>
                    <div className="invalid-feedback">Please choose a faction.</div>
                </div>
                <button className="btn btn-primary" data-action='host' onClick={submit}>Host a game</button>
                <button className="btn btn-default" data-action='join' onClick={submit}>Join a game</button>
            </form>
            {redirectPath !== null && <Redirect to={redirectPath} push={true} />}
        </>
    )
}

export default Home