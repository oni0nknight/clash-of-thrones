import Game from './js/Game'

window.onload = () => {
    document.getElementById('title').innerHTML = 'init'
    const game = new Game('test', 'red')
}