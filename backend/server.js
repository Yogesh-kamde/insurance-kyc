require('dotenv').config()
const http = require('http')
const { Server } = require('socket.io')
const app = require('./app')
const connectDB = require('./utils/db')

connectDB()

const server = http.createServer(app)
const io = new Server(server, {
    cors: { origin: 'http://localhost:3001', methods: ['GET', 'POST'] }
})

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
    })
})

app.set('io', io)

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))