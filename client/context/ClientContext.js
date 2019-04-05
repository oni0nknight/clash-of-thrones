import React from 'react'
import PropTypes from 'prop-types'
import Client from '../js/Client'

export const ClientContext = React.createContext()
const client = new Client()

export const ClientProvider = (props) => (
    <ClientContext.Provider value={client}>
        {props.children}
    </ClientContext.Provider>
)

ClientProvider.propTypes = {
    children: PropTypes.node
}
