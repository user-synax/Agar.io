const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
const scoreEl = document.getElementById('score')
let score = 0

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

const food = []
const FOOD_COUNT = 200

function spawnFood() {
    return {
        x: Math.random() * world.width,
        y: Math.random() * world.height,
        radius: 5,
        color: "#f4a261"
    }
}

function initFood() {
    for (let i = 0; i < FOOD_COUNT; i++) {
        food.push(spawnFood())
    }
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

mouse.x = canvas.width / 2
mouse.y = canvas.height / 2

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

function checkFoodCollision() {
    for (let i = food.length - 1; i >= 0; i--) {
        const f = food[i]
        const dx = player.x - f.x
        const dy = player.y - f.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < player.radius + f.radius) {
            food.splice(i, 1)
            player.radius += 0.2
            score += 10
            food.push(spawnFood())
        }
    }
}

function update(dt) {
    const mouseWorldX = mouse.x + camera.x
    const mouseWorldY = mouse.y + camera.y

    const dx = mouseWorldX - player.x
    const dy = mouseWorldY - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 1) {
        const dirX = dx / distance
        const dirY = dy / distance

        player.x += dirX * player.speed * dt
        player.y += dirY * player.speed * dt
    }

    player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x))
    player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y))
    checkFoodCollision()
    updateCamera()
}

function drawWorldBorder() {
    ctx.strokeStyle = '#e63946'
    ctx.lineWidth = 4
    ctx.strokeRect(0 - camera.x, 0 - camera.y, world.width, world.height)
}

function drawFood() {
    for (const f of food) {
        ctx.beginPath()
        ctx.arc(f.x - camera.x, f.y - camera.y, f.radius, 0, Math.PI * 2)
        ctx.fillStyle = f.color
        ctx.fill()
    }
}

function render() {
    scoreEl.textContent = 'Score: ' + score
    ctx.fillStyle = "#0d0d1a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0 - camera.x, 0 - camera.y, world.width, world.height)

    drawGrid()
    drawWorldBorder()
    drawFood()

    ctx.beginPath()
    ctx.arc(player.x - camera.x, player.y - camera.y, player.radius, 0, Math.PI * 2)
    ctx.fillStyle = player.color
    ctx.fill()
}



initFood()
requestAnimationFrame(gameLoop)