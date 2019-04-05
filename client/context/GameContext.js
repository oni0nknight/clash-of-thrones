import React from 'react'
import PropTypes from 'prop-types'

export const GameContext = React.createContext()

const game = {
    playerName: '',
    faction: ''
}
export const GameProvider = (props) => (
    <GameContext.Provider value={game}>
        {props.children}
    </GameContext.Provider>
)

GameProvider.propTypes = {
    children: PropTypes.node
}
