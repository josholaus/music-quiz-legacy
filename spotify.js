const client_id = process.env.CLIENT_ID
const client_secret = process.env.CLIENT_SECRET
const redirect_uri = process.env.REDIRECT_URI
const scopes =
	'playlist-read-private streaming app-remote-control user-read-playback-state user-modify-playback-state user-read-currently-playing'
const querystring = require('querystring')
const request = require('request')

class Spotify {
	handleLogin(req, res) {
		const url =
			'https://accounts.spotify.com/authorize?' +
			querystring.stringify({
				response_type: 'code',
				client_id: client_id,
				scope: scopes,
				redirect_uri: redirect_uri,
			})
		res.redirect(url)
	}
	handleCallback(req, res) {
		var code = req.query.code || null

		var authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: {
				code: code,
				redirect_uri: redirect_uri,
				grant_type: 'authorization_code',
			},
			headers: {
				Authorization:
					'Basic ' +
					new Buffer(client_id + ':' + client_secret).toString(
						'base64',
					),
			},
			json: true,
		}

		request.post(authOptions, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				var access_token = body.access_token,
					refresh_token = body.refresh_token

				res.redirect(
					'/#' +
						querystring.stringify({
							access_token: access_token,
							refresh_token: refresh_token,
						}),
				)
			} else {
				res.redirect(
					'/#' +
						querystring.stringify({
							error: 'invalid_token',
						}),
				)
			}
		})
	}
}

module.exports = Spotify
