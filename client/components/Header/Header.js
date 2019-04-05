import React from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'

const Header = (props) => (
    <>
        {props.location.pathname !== '/game' &&
            <div id="header" className="jumbotron text-center">
                <h1>Clash of Thrones</h1>
                <p>Welcome to Clash of Thrones!</p>
            </div>
        }
    </>
)

Header.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
}

export default withRouter(Header)