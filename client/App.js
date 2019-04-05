import React from 'react'
import ReactDOM from 'react-dom'
import Header from './components/Header/Header'
import Container from './components/Container/Container'

const App = () => {
    return (
        <>
            <Header />
            <Container>
                <p>Content</p>
            </Container>
        </>
    )
}

window.onload = () => {
    ReactDOM.render(<App />, document.getElementById('app'))
}