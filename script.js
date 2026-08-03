const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

const player = {
    x: 0,
    y: 0,
    radius: 20,
    color: "#4cc9f0",
    speed: 300
}

const mouse = {
    x: 0,
    y: 0
}

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX
    mouse.y = e.clientY
})

function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    player.x = canvas.width / 2
    player.y = canvas.height / 2
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

function update(dt) {
    const dx = mouse.x - player.x
    const dy = mouse.y - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 1) {
        const dirX = dx / distance
        const dirY = dy / distance

        player.x += dirX * player.speed * dt
        player.y += dirY * player.speed * dt
    }
}

function render() {
    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.beginPath()
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2)
    ctx.fillStyle = player.color
    ctx.fill()
}




requestAnimationFrame(gameLoop)