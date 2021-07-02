require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')
const spotify = require('./spotify')

const app = express()
const spotifyApi = new spotify()
const port = 80

app.get('/login', (req, res) => {
	spotifyApi.handleLogin(req, res)
})

app.get('/callback', (req, res) => {
	spotifyApi.handleCallback(req, res)
})

app.use(express.static('public')).use(cookieParser)

app.get('/', (req, res) => {
	res.sendFile('index.html')
})

app.use('*', (req, res) => {
	res.status(404).sendFile('404.html')
})

app.listen(port, () => {
	console.log(`Listening on port ${port}`)
})
