import React, { useState, useEffect, useContext, useCallback } from 'react'

import { ClientContext } from '../../context/ClientContext'

const Home = () => {
    const [playerName, setPlayerName] = useState('')
    const [factions, setFactions] = useState(['test'])
    const client = useContext(ClientContext)

    useEffect(() => {
        client.query('factions').then(allFactions => {
            setFactions(allFactions)
        })
    }, [])

    const hostGame = useCallback((e) => {
        e.preventDefault()
    }, [])
    const joinGame = useCallback((e) => {
        e.preventDefault()
    }, [])

    return (
        <form id="init-form" className='state' noValidate>
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
                <div className="invalid-feedback">
                    Please choose a name.
                </div>
            </div>
            <div className="form-group">
                <label htmlFor="factionSelect">Faction</label>
                <select className="form-control" required>
                    {factions.map((faction, idx) => {
                        return <option key={idx} value={faction.id}>{faction.id}</option>
                    })}
                </select>
                <div className="invalid-feedback">
                    Please choose a faction.
                </div>
            </div>
            <button className="btn btn-primary" onClick={hostGame}>Host a game</button>
            <button className="btn btn-default" onClick={joinGame}>Join a game</button>
        </form>
    )
}

export default Home