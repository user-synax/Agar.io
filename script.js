const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
const scoreEl = document.getElementById('score')
const deathScreenEl = document.getElementById('deathScreen')
const finalScoreEl = document.getElementById('finalScore')
const restartBtn = document.getElementById('restartBtn')
const leaderboardEl = document.getElementById('leaderboard')
const dashStatusEl = document.getElementById('dashStatus')
const dangerOverlayEl = document.getElementById('dangerOverlay')
const highScoreEl = document.getElementById('highScore')

let score = 0
let highScore = parseInt(localStorage.getItem('blobio_highscore')) || 0
let gameOver = false

const player = {
    x: 0,
    y: 0,
    radius: 20,
    color: "#4cc9f0",
    baseSpeed: 600
}

const PLAYER_NORMAL_COLOR = '#4cc9f0'
const PLAYER_KING_COLOR = '#ffd700'

let isDashing = false
let dashCooldownTimer = 0
const DASH_DURATION = 1
const DASH_COOLDOWN = 5
const DASH_MULTIPLIER = 4
const DASH_COST = 2

window.addEventListener('keydown', (e) => {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        triggerDash()
    }
})

function triggerDash() {
    if (dashCooldownTimer <= 0 && player.radius > 15 && !gameOver) {
        isDashing = true
        dashCooldownTimer = DASH_COOLDOWN
        player.radius -= DASH_COST
        playTone(800, 0.15, 'square', 0.12)

        setTimeout(() => {
            isDashing = false
        }, DASH_DURATION * 1000)
    }
}

const mouse = {
    x: 0,
    y: 0
}

const world = {
    width: 5000,
    height: 5000
}

const camera = {
    x: 0,
    y: 0,
    zoom: 1
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

function playTone(frequency, duration, type = 'sine', volume = 0.15) {
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.type = type
    oscillator.frequency.value = frequency

    gainNode.gain.value = volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    oscillator.start()
    oscillator.stop(audioCtx.currentTime + duration)
}

const food = []
const FOOD_COUNT = 200

const bots = []
const BOT_COUNT = 30


function spawnBot() {
    return {
        x: Math.random() * world.width,
        y: Math.random() * world.height,
        radius: 15 + Math.random() * 80,
        color: '#e76f51',
        baseSpeed: 400,
        targetFood: null
    }
}

function updateDangerOverlay() {
    let closestThreatDist = Infinity

    for (const b of bots) {
        if (b.radius > player.radius * 1.1) {
            const dx = b.x - player.x
            const dy = b.y - player.y
            const dist = Math.sqrt(dx * dx + dy * dy) - player.radius - b.radius

            if (dist < closestThreatDist) {
                closestThreatDist = dist
            }
        }
    }

    const DANGER_RANGE = 300

    if (closestThreatDist < DANGER_RANGE) {
        const intensity = 1 - Math.max(0, closestThreatDist) / DANGER_RANGE
        dangerOverlayEl.style.boxShadow = `inset 0 0 150px rgba(255, 0, 0, ${intensity * 0.6})`
    } else {
        dangerOverlayEl.style.boxShadow = 'inset 0 0 150px rgba(255, 0, 0, 0)'
    }
}

function updateLeaderboard() {
    const entries = bots.map(b => ({ name: 'Bot', radius: b.radius, isPlayer: false }))
    entries.push({ name: 'You', radius: player.radius, isPlayer: true })

    entries.sort((a, b) => b.radius - a.radius)

    if (entries[0].isPlayer) {
        player.color = PLAYER_KING_COLOR
    } else {
        player.color = PLAYER_NORMAL_COLOR
    }

    const top5 = entries.slice(0, 5)

    let html = '<h3>Leaderboard</h3>'
    top5.forEach((e, i) => {
        const cls = e.isPlayer ? 'you' : ''
        const crown = i === 0 ? ' 👑' : ''
        html += `<div class="${cls}">${i + 1}. ${e.name} - ${Math.floor(e.radius)}${crown}</div>`
    })

    leaderboardEl.innerHTML = html
}

function initBots() {
    for (let i = 0; i < BOT_COUNT; i++) {
        bots.push(spawnBot())
    }
}

function spawnFood() {
    const isRare = Math.random() < 0.05 // 5% chance rare hone ka

    if (isRare) {
        return {
            x: Math.random() * world.width,
            y: Math.random() * world.height,
            radius: 12,
            color: '#b565f0',
            growth: 2,
            scoreValue: 50,
            isRare: true
        }
    }

    return {
        x: Math.random() * world.width,
        y: Math.random() * world.height,
        radius: 5,
        color: "#f4a261",
        growth: 0.2,
        scoreValue: 10,
        isRare: false
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
    camera.zoom = Math.max(0.5, 1 - (player.radius - 20) * 0.003)
    camera.x = player.x - (canvas.width / camera.zoom) / 2
    camera.y = player.y - (canvas.height / camera.zoom) / 2
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
            player.radius += f.growth
            score += f.scoreValue
            food.push(spawnFood())
            playTone(f.isRare ? 900 : 600, f.isRare ? 0.2 : 0.1, 'sine', f.isRare ? 0.15 : 0.1)
        }
    }
}

restartBtn.addEventListener('click', () => {
    location.reload()
})

function update(dt) {
    if (gameOver) return

    if (dashCooldownTimer > 0) {
        dashCooldownTimer -= dt
    }

    const mouseWorldX = mouse.x + camera.x
    const mouseWorldY = mouse.y + camera.y

    const dx = mouseWorldX - player.x
    const dy = mouseWorldY - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    let currentSpeed = player.baseSpeed / (player.radius * 0.05 + 1)
    if (isDashing) {
        currentSpeed *= DASH_MULTIPLIER
    }

    if (distance > 1) {
        const dirX = dx / distance
        const dirY = dy / distance

        player.x += dirX * currentSpeed * dt
        player.y += dirY * currentSpeed * dt
    }

    player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x))
    player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y))
    checkFoodCollision()
    updateBots(dt)
    checkBotFoodCollision()
    checkPlayerBotCollision()
    updateCamera()
}

function checkPlayerBotCollision() {
    for (let i = bots.length - 1; i >= 0; i--) {
        const b = bots[i]
        const dx = player.x - b.x
        const dy = player.y - b.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < player.radius + b.radius) {
            if (player.radius > b.radius * 1.1) {
                player.radius += b.radius * 0.3
                score += Math.floor(b.radius * 5)
                bots.splice(i, 1)
                bots.push(spawnBot())
                playTone(300, 0.25, 'sawtooth', 0.15)
            } else if (b.radius > player.radius * 1.1) {
                playTone(150, 0.6, 'sawtooth', 0.2)
                gameOver = true
                finalScoreEl.textContent = 'Score: ' + score
                deathScreenEl.classList.remove('hidden')

            }
        }
    }
}

function checkBotFoodCollision() {
    for (const b of bots) {
        for (let i = food.length - 1; i >= 0; i--) {
            const f = food[i]
            const dx = b.x - f.x
            const dy = b.y - f.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < b.radius + f.radius) {
                food.splice(i, 1)
                b.radius += f.growth
                food.push(spawnFood())
            }
        }
    }
}

function updateBots(dt) {
    for (const b of bots) {
        let targetX, targetY

        const dxPlayer = player.x - b.x
        const dyPlayer = player.y - b.y
        const distToPlayer = Math.sqrt(dxPlayer * dxPlayer + dyPlayer * dyPlayer)

        // agar bot player se kaafi bada hai aur paas hai, to chase karo
        if (b.radius > player.radius * 1.15 && distToPlayer < 400) {
            targetX = player.x
            targetY = player.y
        } else {
            // warna nearest food dhoondo (purana logic)
            let nearestFood = null
            let nearestDist = Infinity

            for (const f of food) {
                const dx = f.x - b.x
                const dy = f.y - b.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist < nearestDist) {
                    nearestDist = dist
                    nearestFood = f
                }
            }

            if (nearestFood) {
                targetX = nearestFood.x
                targetY = nearestFood.y
            }
        }

        if (targetX !== undefined) {
            const dx = targetX - b.x
            const dy = targetY - b.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const currentSpeed = b.baseSpeed / (b.radius * 0.05 + 1)

            if (dist > 1) {
                const dirX = dx / dist
                const dirY = dy / dist
                b.x += dirX * currentSpeed * dt
                b.y += dirY * currentSpeed * dt
            }
        }

        b.x = Math.max(b.radius, Math.min(world.width - b.radius, b.x))
        b.y = Math.max(b.radius, Math.min(world.height - b.radius, b.y))
    }
}

function drawWorldBorder() {
    ctx.strokeStyle = '#e63946'
    ctx.lineWidth = 4
    ctx.strokeRect(0 - camera.x, 0 - camera.y, world.width, world.height)
}
function drawFood() {
    for (const f of food) {
        const screenX = f.x - camera.x
        const screenY = f.y - camera.y

        if (f.isRare) {
            drawStar(screenX, screenY, f.radius, f.color)
        } else {
            ctx.beginPath()
            ctx.arc(screenX, screenY, f.radius, 0, Math.PI * 2)
            ctx.fillStyle = f.color
            ctx.fill()
        }
    }
}

function drawStar(cx, cy, radius, color) {
    const spikes = 5
    const outerRadius = radius
    const innerRadius = radius * 0.5
    let rot = (Math.PI / 2) * 3
    const step = Math.PI / spikes

    ctx.beginPath()
    ctx.moveTo(cx, cy - outerRadius)

    for (let i = 0; i < spikes; i++) {
        let x = cx + Math.cos(rot) * outerRadius
        let y = cy + Math.sin(rot) * outerRadius
        ctx.lineTo(x, y)
        rot += step

        x = cx + Math.cos(rot) * innerRadius
        y = cy + Math.sin(rot) * innerRadius
        ctx.lineTo(x, y)
        rot += step
    }

    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()

    // halka glow effect star ko highlight karne ke liye
    ctx.shadowColor = color
    ctx.shadowBlur = 15
    ctx.fill()
    ctx.shadowBlur = 0
}

function drawBots() {
    for (const b of bots) {
        ctx.beginPath()
        ctx.arc(b.x - camera.x, b.y - camera.y, b.radius, 0, Math.PI * 2)
        ctx.fillStyle = b.color
        ctx.fill()
    }
}

function render() {
    scoreEl.textContent = 'Score: ' + score

    if (score > highScore) {
        highScore = score
        localStorage.setItem('blobio_highscore', highScore)
    }
    highScoreEl.textContent = 'Best: ' + highScore

    dashStatusEl.textContent = dashCooldownTimer > 0
        ? 'Dash: ' + dashCooldownTimer.toFixed(1) + 's'
        : 'Dash: Ready (Shift)'
    updateLeaderboard()
    updateDangerOverlay()


    ctx.fillStyle = "#0d0d1a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.scale(camera.zoom, camera.zoom)

    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0 - camera.x, 0 - camera.y, world.width, world.height)

    drawGrid()
    drawWorldBorder()
    drawFood()
    drawBots()

    ctx.beginPath()
    ctx.arc(player.x - camera.x, player.y - camera.y, player.radius, 0, Math.PI * 2)
    ctx.fillStyle = player.color
    ctx.fill()

    ctx.restore()
}



initFood()
initBots()
requestAnimationFrame(gameLoop)