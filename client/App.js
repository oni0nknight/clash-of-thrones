import React from 'react'
import ReactDOM from 'react-dom'

import Header from './components/Header/Header'
import Container from './components/Container/Container'
import Home from './components/Home/Home'

import { ClientProvider } from './context/ClientContext'

const App = () => {
    return (
        <ClientProvider>
            <Header />
            <Container>
                <Home />
            </Container>
        </ClientProvider>
    )
}

window.onload = () => {
    ReactDOM.render(<App />, document.getElementById('app'))
}