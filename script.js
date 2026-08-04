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

const lobbyScreenEl = document.getElementById('lobbyScreen')
const lobbyCoinsEl = document.getElementById('lobbyCoins')
const lobbyHighScoreEl = document.getElementById('lobbyHighScore')
const lobbyGamesPlayedEl = document.getElementById('lobbyGamesPlayed')
const skinGridEl = document.getElementById('skinGrid')
const playBtn = document.getElementById('playBtn')
const nicknameInputEl = document.getElementById('nicknameInput')

let playerData = loadPlayerData()
if (!playerData.nickname) playerData.nickname = 'Player'
function loadPlayerData() {
    const saved = localStorage.getItem('blobio_playerData')
    if (saved) {
        return JSON.parse(saved)
    }
    return {
        nickname: 'Player',
        totalCoins: 0,
        highScore: 0,
        gamesPlayed: 0,
        unlockedSkins: ['default'],
        selectedSkin: 'default'
    }
}

const DECAY_THRESHOLD = 90
const DECAY_RATE = 2


const SKINS = {
    default: {
        name: 'Default',
        cost: 0,
        type: 'solid',
        color: '#4cc9f0'
    },
    glowRed: {
        name: 'Ruby Glow',
        cost: 50,
        type: 'glow',
        color: '#ff4d4d'
    },
    glowPurple: {
        name: 'Amethyst Glow',
        cost: 50,
        type: 'glow',
        color: '#b565f0'
    },
    glowGreen: {
        name: 'Emerald Glow',
        cost: 50,
        type: 'glow',
        color: '#39ff88'
    },
    watermelon: {
        name: 'Watermelon',
        cost: 150,
        type: 'watermelon'
    },
    lemon: {
        name: 'Lemon',
        cost: 150,
        type: 'lemon'
    },
    flagIndia: {
        name: 'India',
        cost: 300,
        type: 'flagIndia'
    }
}

const BOT_NAMES = [
    'Rex', 'Nova', 'Blaze', 'Zuko', 'Vortex', 'Echo', 'Titan', 'Luna',
    'Ghost', 'Raptor', 'Comet', 'Shadow', 'Viper', 'Bolt', 'Storm',
    'Frost', 'Ember', 'Rogue', 'Drift', 'Onyx'
]

function generateBotName() {
    const base = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
    const useNumber = Math.random() < 0.4
    return useNumber ? base + '_' + Math.floor(Math.random() * 99) : base
}

function renderSkinGrid() {
    let html = ''

    for (const key in SKINS) {
        const skin = SKINS[key]
        const isUnlocked = playerData.unlockedSkins.includes(key)
        const isSelected = playerData.selectedSkin === key

        let previewStyle = ''
        if (skin.type === 'watermelon') previewStyle = 'background: radial-gradient(circle, #ff4d4d 40%, #2d6a4f 41%)'
        else if (skin.type === 'lemon') previewStyle = 'background: #fff44f'
        else if (skin.type === 'flagIndia') previewStyle = 'background: linear-gradient(to bottom, #FF9933 33%, #FFFFFF 33% 66%, #138808 66%)'
        else previewStyle = `background: ${skin.color}; ${skin.type === 'glow' ? `box-shadow: 0 0 15px ${skin.color}` : ''}`

        html += `
            <div class="skin-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}" data-skin="${key}">
                <div class="skin-preview" style="${previewStyle}"></div>
                <p>${skin.name}</p>
                <p>${isUnlocked ? (isSelected ? 'Selected' : 'Owned') : skin.cost + ' coins'}</p>
            </div>
        `
    }

    skinGridEl.innerHTML = html

    document.querySelectorAll('.skin-card').forEach(card => {
        card.addEventListener('click', () => handleSkinClick(card.dataset.skin))
    })
}

function handleSkinClick(key) {
    const skin = SKINS[key]
    const isUnlocked = playerData.unlockedSkins.includes(key)

    if (isUnlocked) {
        playerData.selectedSkin = key
        savePlayerData()
        renderSkinGrid()
    } else {
        if (playerData.totalCoins >= skin.cost) {
            playerData.totalCoins -= skin.cost
            playerData.unlockedSkins.push(key)
            playerData.selectedSkin = key
            savePlayerData()
            renderSkinGrid()
            updateLobbyStats()
            playTone(1200, 0.15, 'sine', 0.15)
        } else {
            playTone(200, 0.2, 'square', 0.15)
        }
    }
}

function updateLobbyStats() {
    lobbyCoinsEl.textContent = playerData.totalCoins
    lobbyHighScoreEl.textContent = playerData.highScore
    lobbyGamesPlayedEl.textContent = playerData.gamesPlayed
    nicknameInputEl.value = playerData.nickname
}

nicknameInputEl.addEventListener('input', () => {
    const trimmed = nicknameInputEl.value.trim()
    playerData.nickname = trimmed.length > 0 ? trimmed : 'Player'
    savePlayerData()
})

function savePlayerData() {
    localStorage.setItem('blobio_playerData', JSON.stringify(playerData))
}



let score = 0
let highScore = parseInt(localStorage.getItem('blobio_highscore')) || 0
let gameOver = false

const player = {
    x: 0,
    y: 0,
    radius: 20,
    color: "#4cc9f0",
    baseSpeed: 600,
    cells: []
}

const MIN_SPLIT_RADIUS = 40
const MERGE_COOLDOWN = 12
const SPLIT_BOOST = 800

const PLAYER_NORMAL_COLOR = '#4cc9f0'
const PLAYER_KING_COLOR = '#ffd700'

let isDashing = false
let dashCooldownTimer = 0
const DASH_DURATION = 1
const DASH_COOLDOWN = 5
const DASH_MULTIPLIER = 4
const DASH_COST = 2

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

const coins = []
const COIN_COUNT = 45


function spawnCoin() {
    return {
        x: Math.random() * world.width,
        y: Math.random() * world.height,
        radius: 8,
        value: 1
    }
}

function initCoins() {
    for (let i = 0; i < COIN_COUNT; i++) {
        coins.push(spawnCoin())
    }
}

let sessionCoins = 0

function checkCoinCollision() {
    for (const cell of player.cells) {
        for (let i = coins.length - 1; i >= 0; i--) {
            const c = coins[i]
            const dx = cell.x - c.x
            const dy = cell.y - c.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < cell.radius + c.radius) {
                coins.splice(i, 1)
                sessionCoins += c.value
                playerData.totalCoins += c.value
                savePlayerData()
                coins.push(spawnCoin())
                playTone(1000, 0.08, 'triangle', 0.12)
            }
        }
    }
}

function drawCoins() {
    for (const c of coins) {
        const screenX = c.x - camera.x
        const screenY = c.y - camera.y

        ctx.beginPath()
        ctx.arc(screenX, screenY, c.radius, 0, Math.PI * 2)
        ctx.fillStyle = '#ffd700'
        ctx.fill()
        ctx.strokeStyle = '#b8860b'
        ctx.lineWidth = 2
        ctx.stroke()
    }
}

function drawPlayer() {
    for (const cell of player.cells) {
        drawPlayerCell(cell)
    }
}

function drawPlayerCell(cell) {
    const screenX = cell.x - camera.x
    const screenY = cell.y - camera.y
    const radius = cell.radius
    const skin = SKINS[playerData.selectedSkin]

    if (skin.type === 'solid') {
        ctx.beginPath()
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2)
        ctx.fillStyle = player.color
        ctx.fill()

    } else if (skin.type === 'glow') {
        ctx.beginPath()
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2)
        ctx.fillStyle = player.color
        ctx.fill()

        ctx.shadowColor = skin.color
        ctx.shadowBlur = 25
        ctx.fill()
        ctx.shadowBlur = 0

    } else if (skin.type === 'watermelon') {
        ctx.beginPath()
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2)
        ctx.fillStyle = '#2d6a4f'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(screenX, screenY, radius * 0.75, 0, Math.PI * 2)
        ctx.fillStyle = '#ff4d4d'
        ctx.fill()

        ctx.strokeStyle = '#1b4332'
        ctx.lineWidth = radius * 0.15
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            ctx.beginPath()
            ctx.moveTo(screenX, screenY)
            ctx.lineTo(screenX + Math.cos(a) * radius, screenY + Math.sin(a) * radius)
            ctx.stroke()
        }

        ctx.fillStyle = '#1b1b1b'
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2
            const sx = screenX + Math.cos(a) * radius * 0.4
            const sy = screenY + Math.sin(a) * radius * 0.4
            ctx.beginPath()
            ctx.arc(sx, sy, radius * 0.06, 0, Math.PI * 2)
            ctx.fill()
        }

    } else if (skin.type === 'lemon') {
        ctx.beginPath()
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2)
        ctx.fillStyle = '#fff44f'
        ctx.fill()

        ctx.fillStyle = '#e6d200'
        for (let i = 0; i < 10; i++) {
            const a = Math.random() * Math.PI * 2
            const r = Math.random() * radius * 0.8
            const dx = screenX + Math.cos(a) * r
            const dy = screenY + Math.sin(a) * r
            ctx.beginPath()
            ctx.arc(dx, dy, 1.5, 0, Math.PI * 2)
            ctx.fill()
        }
    } else if (skin.type === 'flagIndia') {
        ctx.save()
        ctx.beginPath()
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2)
        ctx.clip()

        const top = screenY - radius
        const stripeHeight = (radius * 2) / 3

        ctx.fillStyle = '#FF9933'
        ctx.fillRect(screenX - radius, top, radius * 2, stripeHeight)

        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(screenX - radius, top + stripeHeight, radius * 2, stripeHeight)

        ctx.fillStyle = '#138808'
        ctx.fillRect(screenX - radius, top + stripeHeight * 2, radius * 2, stripeHeight)

        const chakraRadius = radius * 0.22
        ctx.strokeStyle = '#000080'
        ctx.lineWidth = Math.max(1, radius * 0.03)
        ctx.beginPath()
        ctx.arc(screenX, screenY, chakraRadius, 0, Math.PI * 2)
        ctx.stroke()

        for (let i = 0; i < 24; i++) {
            const a = (i / 24) * Math.PI * 2
            ctx.beginPath()
            ctx.moveTo(screenX, screenY)
            ctx.lineTo(screenX + Math.cos(a) * chakraRadius, screenY + Math.sin(a) * chakraRadius)
            ctx.stroke()
        }

        ctx.restore()

        ctx.beginPath()
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'
        ctx.lineWidth = 1.5
        ctx.stroke()
    }
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
const FOOD_COUNT = 300

const bots = []
const BOT_COUNT = 30


function spawnBot() {
    return {
        x: Math.random() * world.width,
        y: Math.random() * world.height,
        radius: 15 + Math.random() * 50,
        color: '#fc3200',
        baseSpeed: 400,
        targetFood: null,
        name: generateBotName()
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
    const entries = bots.map(b => ({ name: b.name, radius: b.radius, isPlayer: false }))
    entries.push({ name: playerData.nickname, radius: player.radius, isPlayer: true })

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
player.cells = [
    { x: player.x, y: player.y, radius: player.radius, vx: 0, vy: 0, mergeTimer: 0 }
]

window.addEventListener('keydown', (e) => {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        triggerDash()
    }
    if (e.code === 'Space') {
        triggerSplit()
    }
})

function triggerSplit() {
    if (gameOver) return
    if (player.cells.length >= 2) return // already split hai

    const cell = player.cells[0]
    if (cell.radius < MIN_SPLIT_RADIUS) return

    const newRadius = cell.radius / Math.SQRT2

    const mouseWorldX = mouse.x / camera.zoom + camera.x
    const mouseWorldY = mouse.y / camera.zoom + camera.y
    const dx = mouseWorldX - cell.x
    const dy = mouseWorldY - cell.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const dirX = dx / dist
    const dirY = dy / dist

    cell.radius = newRadius
    cell.mergeTimer = MERGE_COOLDOWN

    player.cells.push({
        x: cell.x,
        y: cell.y,
        radius: newRadius,
        vx: dirX * SPLIT_BOOST,
        vy: dirY * SPLIT_BOOST,
        mergeTimer: MERGE_COOLDOWN
    })

    playTone(700, 0.15, 'square', 0.15)
}

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
    ctx.lineWidth = 1 / camera.zoom

    const viewWidth = canvas.width / camera.zoom
    const viewHeight = canvas.height / camera.zoom

    const startX = -camera.x % gridSize
    const startY = -camera.y % gridSize

    for (let x = startX; x < viewWidth; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, viewHeight)
        ctx.stroke()
    }

    for (let y = startY; y < viewHeight; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(viewWidth, y)
        ctx.stroke()
    }
}
function checkFoodCollision() {
    for (const cell of player.cells) {
        for (let i = food.length - 1; i >= 0; i--) {
            const f = food[i]
            const dx = cell.x - f.x
            const dy = cell.y - f.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < cell.radius + f.radius) {
                food.splice(i, 1)
                cell.radius += f.growth
                score += f.scoreValue
                food.push(spawnFood())
                playTone(f.isRare ? 900 : 600, f.isRare ? 0.2 : 0.1, 'sine', f.isRare ? 0.15 : 0.1)
            }
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

    const mouseWorldX = mouse.x / camera.zoom + camera.x
    const mouseWorldY = mouse.y / camera.zoom + camera.y

    for (const cell of player.cells) {
        const dx = mouseWorldX - cell.x
        const dy = mouseWorldY - cell.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        let currentSpeed = player.baseSpeed / (cell.radius * 0.02 + 1)
        if (isDashing && player.cells.length === 1) {
            currentSpeed *= DASH_MULTIPLIER
        }

        if (distance > 1) {
            const dirX = dx / distance
            const dirY = dy / distance
            cell.x += dirX * currentSpeed * dt
            cell.y += dirY * currentSpeed * dt
        }

        // impulse velocity (split boost) friction se kam hoti jaati hai
        cell.x += cell.vx * dt
        cell.y += cell.vy * dt
        cell.vx *= 0.9
        cell.vy *= 0.9

        cell.x = Math.max(cell.radius, Math.min(world.width - cell.radius, cell.x))
        cell.y = Math.max(cell.radius, Math.min(world.height - cell.radius, cell.y))

        if (cell.radius > DECAY_THRESHOLD) {
            cell.radius -= DECAY_RATE * dt
        }

        if (cell.mergeTimer > 0) {
            cell.mergeTimer -= dt
        }
    }

    tryMergeCells()
    syncPlayerAggregate()

    checkFoodCollision()
    checkCoinCollision()
    updateBots(dt)
    checkBotFoodCollision()
    checkPlayerBotCollision()
    updateCamera()
}

function tryMergeCells() {
    if (player.cells.length < 2) return

    const [a, b] = player.cells
    if (a.mergeTimer > 0 || b.mergeTimer > 0) return

    const dx = a.x - b.x
    const dy = a.y - b.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < a.radius + b.radius) {
        const mergedRadius = Math.sqrt(a.radius * a.radius + b.radius * b.radius)
        const mergedX = (a.x + b.x) / 2
        const mergedY = (a.y + b.y) / 2

        player.cells = [
            { x: mergedX, y: mergedY, radius: mergedRadius, vx: 0, vy: 0, mergeTimer: 0 }
        ]
        playTone(500, 0.15, 'sine', 0.12)
    }
}

function syncPlayerAggregate() {
    let totalArea = 0
    let sumX = 0
    let sumY = 0

    for (const cell of player.cells) {
        totalArea += cell.radius * cell.radius
        sumX += cell.x
        sumY += cell.y
    }

    player.radius = Math.sqrt(totalArea)
    player.x = sumX / player.cells.length
    player.y = sumY / player.cells.length
}

function checkPlayerBotCollision() {
    for (let i = bots.length - 1; i >= 0; i--) {
        const b = bots[i]

        for (let c = player.cells.length - 1; c >= 0; c--) {
            const cell = player.cells[c]
            const dx = cell.x - b.x
            const dy = cell.y - b.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < cell.radius + b.radius) {
                if (cell.radius > b.radius * 1.1) {
                    cell.radius += b.radius * 0.3
                    score += Math.floor(b.radius * 5)
                    bots.splice(i, 1)
                    bots.push(spawnBot())
                    playTone(300, 0.25, 'sawtooth', 0.15)
                    break
                } else if (b.radius > cell.radius * 1.1) {
                    playTone(200, 0.3, 'sawtooth', 0.15)
                    player.cells.splice(c, 1)

                    if (player.cells.length === 0) {
                        playTone(150, 0.6, 'sawtooth', 0.2)
                        gameOver = true
                        finalScoreEl.textContent = `Eaten by ${b.name} | Score: ${score}` + (score >= highScore ? ' (New Best!)' : '')
                        deathScreenEl.classList.remove('hidden')
                    }
                    break
                }
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

        if (b.radius > DECAY_THRESHOLD) {
            b.radius -= DECAY_RATE * dt
        }

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
    drawCoins()
    drawBots()

    drawPlayer()
    ctx.restore()
}



initCoins()
updateLobbyStats()
renderSkinGrid()

playBtn.addEventListener('click', () => {
    lobbyScreenEl.classList.add('hidden')
    startGame()
})

function startGame() {
    playerData.gamesPlayed++
    savePlayerData()

    initFood()
    initCoins()
    initBots()
    requestAnimationFrame(gameLoop)
}