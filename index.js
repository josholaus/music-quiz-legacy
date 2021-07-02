require('dotenv').config()
const express = require('express')
const spotify = require('./spotify')

const app = express()
const spotifyApi = new spotify()
const port = process.env.PORT

app.use(express.static('public'))

app.get('/', (req, res) => {
	res.sendFile('index.html')
})

app.get('/login', (req, res) => {
	spotifyApi.handleLogin(req, res)
})

app.get('/callback', (req, res) => {
	spotifyApi.handleCallback(req, res)
})

app.get('/refresh_token', (req, res) => {
	spotifyApi.handleRefresh(req, res)
})

app.get('*', (req, res) => {
	res.status(400).sendFile(__dirname + '/public/404.html')
})

app.listen(port, () => {
	console.log(`Listening on port ${port}`)
})
