import React, { useState, useEffect, useContext } from 'react'
import { Redirect } from 'react-router-dom'

import { ClientContext } from '../../context/ClientContext'

import Loader from '../Loader/Loader'

const Wait = () => {
    const [redirect, setRedirect] = useState(false)

    const client = useContext(ClientContext)

    useEffect(() => {
        const playerJoined = () => {
            setRedirect(true)
        }

        // Subscribe to game list updates
        client.subscribe('gameReady', playerJoined)
        return () => {
            client.unsubscribe('gameReady', playerJoined)
        }
    }, [])

    return (
        <>
            <h3>Waiting for another player...</h3>
            <Loader />
            {redirect && <Redirect to='/game' push={true} />}
        </>
    )
}

export default Wait