export default class AppState {
    constructor(client) {
        this.client = client
    }

    // Interface with app
    //=======================================

    switchToState(state, ...args) {
        const event = new CustomEvent('switchState', { detail: {state, args} })
        document.dispatchEvent(event)
    }

    rollbackState() {
        const event = new CustomEvent('rollbackState', {})
        document.dispatchEvent(event)
    }

    // Lifecycle
    //=======================================

    start() {}
    stop() {}
    show() {}
    hide() {}
    bindEvents() {}
    unBindEvents() {}

    enter(...args) {
        this.show()
        this.start(...args)
        this.bindEvents()
    }

    leave() {
        this.unBindEvents()
        this.stop()
        this.hide()
    }
}