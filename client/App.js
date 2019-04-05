import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import Header from './components/Header/Header'
import Container from './components/Container/Container'
import Home from './components/Home/Home'
import HostLobby from './components/HostLobby/HostLobby'
import JoinLobby from './components/JoinLobby/JoinLobby'
import Wait from './components/Wait/Wait'

import { ClientProvider } from './context/ClientContext'
import { GameProvider } from './context/GameContext'

const App = () => {
    return (
        <ClientProvider>
            <GameProvider>
                <Header />
                <Container>
                    <Router>
                        <Switch>
                            <Route exact path="/" component={Home} />
                            <Route path="/host" component={HostLobby} />
                            <Route path="/join" component={JoinLobby} />
                            <Route path="/wait" component={Wait} />
                        </Switch>
                    </Router>
                </Container>
            </GameProvider>
        </ClientProvider>
    )
}

window.onload = () => {
    ReactDOM.render(<App />, document.getElementById('app'))
}