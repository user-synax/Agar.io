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

const world = {
    width: 3000,
    height: 3000
}

const camera = {
    x: 0,
    y: 0
}

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX
    mouse.y = e.clientY
})

function updateCamera() {
    camera.x = player.x - canvas.width / 2
    camera.y = player.y - canvas.height / 2
}

function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
}

resizeCanvas()
window.addEventListener('resize', resizeCanvas)

player.x = world.width / 2
player.y = world.height / 2

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

function drawGrid() {
    const gridSize = 100
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1

    const startX = -camera.x % gridSize
    const startY = -camera.y % gridSize

    for (let x = startX; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
    }

    for (let y = startY; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
    }
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

    player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x))
    player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y))

    updateCamera()
}

function render() {
    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    drawGrid()

    ctx.beginPath()
    ctx.arc(player.x - camera.x, player.y - camera.y, player.radius, 0, Math.PI * 2)
    ctx.fillStyle = player.color
    ctx.fill()
}




requestAnimationFrame(gameLoop)