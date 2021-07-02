var storedTracks = []
var currentSong = {}

$(document).on('ready', () => {
	$('#loggedIn').hide()
	$('.media-control').hide()
	$('.now-playing').hide()
	$('.left-songs').hide()

	noUiSlider.create($('#dual-slider')[0], {
		start: [15, 30],
		connect: true,
		step: 1,
		orientation: 'horizontal',
		tooltips: [true, true],
		animate: true,
		range: {
			min: 0,
			max: 90,
		},
		format: {
			to: (value) => {
				return Math.trunc(value)
			},
			from: (value) => {
				return Math.trunc(value)
			},
		},
	})

	noUiSlider.create($('#slider')[0], {
		start: [100],
		step: 1,
		orientation: 'horizontal',
		tooltips: [true],
		animate: true,
		range: {
			min: 0,
			max: 200,
		},
		format: {
			from: (value) => {
				return Math.trunc(value)
			},
			to: (value) => {
				return Math.trunc(value)
			},
		},
	})

	function getHashParams() {
		var hashParams = {}
		var e,
			r = /([^&;=]+)=?([^&;]*)/g,
			q = window.location.hash.substring(1)
		while ((e = r.exec(q))) {
			hashParams[e[1]] = decodeURIComponent(e[2])
		}
		return hashParams
	}

	var params = getHashParams()

	var access_token = params.access_token,
		refresh_token = params.refresh_token,
		error = params.error

	if (error) {
		alert('There was an error during the authentication')
	} else {
		if (access_token) {
			$('#loggedIn').show()
			$('#login').hide()
		} else {
			$('#login').show()
			$('#loggedIn').hide()
		}
	}

	$(document).on('keydown', (event) => {
		if (event.shiftKey && event.key === 'N' && storedTracks.length > 0) {
			nextSong()
		}
		if (event.shiftKey && event.key === 'K') {
			pausePlayback()
		}
	})

	$('#submit-playlists').click(function () {
		fetchPlaylistTracks().then(() => {
			$(this).hide()
			$('#playlist-input').hide()
			$('#fast-forward').hide()
			$('#songs-per-playlist').hide()
			$('.media-control').show()
			$('.now-playing').show()
			$('.left-songs').show()
			playRandomSong(storedTracks)
		})
	})

	var playlistEditorIsVisible = false

	$('#edit-playlists').click(() => {
		$('#playlist-input').toggle('fast')
		if (playlistEditorIsVisible) {
			fetchPlaylistTracks()
		}
		playlistEditorIsVisible = !playlistEditorIsVisible
	})

	$('#next-playlist').click(() => {
		nextSong()
	})

	$('#pause-playlist').click(() => {
		pausePlayback()
	})

	var fastForwardValue = [15, 30]

	$('#dual-slider')[0].noUiSlider.on('change', () => {
		fastForwardValue = $('#dual-slider')[0].noUiSlider.get()
	})

	var songsPerPlaylist = 100

	$('#slider')[0].noUiSlider.on('change', () => {
		songsPerPlaylist = $('#slider')[0].noUiSlider.get()
	})

	function getPlaylistTracks(playlistId) {
		return new Promise((resolve, reject) => {
			$.ajax({
				url: `https://api.spotify.com/v1/playlists/${playlistId}`,
				headers: {
					Authorization: 'Bearer ' + access_token,
				},
				success: function (response) {
					if (response.tracks.next) {
						getMoreTracks(response.tracks.next).then((v) => {
							resolve(
								v
									.concat(response.tracks.items)
									.map((v) => v.track)
									.sort(() => Math.random() - 0.5)
									.slice(0, songsPerPlaylist),
							)
						})
					} else {
						resolve(response.tracks.items.map((v) => v.track))
					}
				},
				error: (res) => {
					reject(res)
				},
			})
		})
	}

	function getMoreTracks(url) {
		return new Promise((resolve) => {
			$.ajax({
				url: url,
				headers: {
					Authorization: 'Bearer ' + access_token,
				},
				success: function (response) {
					let tracks = response.items
					if (response.next !== null) {
						getMoreTracks(response.next).then((nextTracks) => {
							resolve(tracks.concat(nextTracks))
						})
					} else {
						resolve(tracks)
					}
				},
			})
		})
	}

	function fetchPlaylistTracks() {
		return new Promise((resolve, reject) => {
			const playlistValues = $('#playlist-values').val().split('\n')
			const promises = playlistValues.map((v) =>
				getPlaylistTracks(v.split('/')[4].split('?')[0]),
			)
			Promise.all(promises)
				.then((values) => {
					let items = values.flat()
					let exists = []
					let toRemove = []
					items.forEach((v) => {
						if (exists.includes(v.id)) {
							toRemove.push(v)
						}
						exists.push(v.id)
					})
					items = items.filter((v) => !toRemove.includes(v))
					storedTracks = items
					$('#left-songs-number').html(storedTracks.length)
					resolve(null)
				})
				.catch((err) => {
					console.log(err);
					alert(
						'Error fetching playlists. Do you have access to all of them?',
					)
				})
		})
	}

	function nextSong() {
		storedTracks = storedTracks.filter((v) => {
			return v.id !== currentSong.id
		})
		$('#left-songs-number').html(storedTracks.length)
		playRandomSong(storedTracks)
	}

	function playRandomSong(items) {
		const randomTrack = items[Math.floor(Math.random() * items.length)]
		const artists = randomTrack.artists.map((v) => v.name).join(', ')
		const name = randomTrack.name
		currentSong = randomTrack
		$('#track-info').html(artists + ' - "' + name + '"')
		$.ajax({
			url: `https://api.spotify.com/v1/me/player/play`,
			type: 'PUT',
			data: JSON.stringify({
				uris: [randomTrack.uri],
				offset: {
					position: 0,
				},
				position_ms:
					Math.floor(Math.random() * fastForwardValue[0] * 1000) +
					fastForwardValue[1] * 1000,
			}),
			dataType: 'json',
			processData: false,
			contentType: 'application/json',
			headers: {
				Authorization: 'Bearer ' + access_token,
			},
			success: function (response) {
				$('#pause-playlist').html('⏸')
			},
			error: function (response) {
				$('#track-info').html('Error')
				$('#pause-playlist').html('⏵️')
				alert(JSON.parse(response.responseText).error.message)
			},
		})
	}

	function pausePlayback() {
		const element = $('#pause-playlist')
		var url = ''
		if (element.html() === '⏸') {
			url = `https://api.spotify.com/v1/me/player/pause`
		} else {
			url = `https://api.spotify.com/v1/me/player/play`
		}
		$.ajax({
			url: url,
			type: 'PUT',
			processData: false,
			headers: {
				Authorization: 'Bearer ' + access_token,
			},
			success: function (response) {
				if (element.html() === '⏸') {
					element.html('⏵️')
				} else {
					element.html('⏸')
				}
			},
			error: function (response) {
				alert(JSON.parse(response.responseText).error.message)
			},
		})
	}
});
