const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
}

resizeCanvas()
window.addEventListener('resize', resizeCanvas)

let lastTime = 0
let deltaTime = 0

function gameLoop(currentTime) {
    if (!lastTime) lastTime = currentTime
    deltaTime = (currentTime - lastTime) / 1000
    lastTime = currentTime

    update(deltaTime)
    render()

    requestAnimationFrame(gameLoop)
}

function update(dt) { }

function render() {
    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

requestAnimationFrame(gameLoop)