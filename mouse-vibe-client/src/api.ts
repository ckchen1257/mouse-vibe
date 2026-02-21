import { getAuthUser } from './lib/authState'

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const weatherForecastUrl = `${apiBaseUrl}/weatherforecast`

export async function apiFetch(input: string, init: RequestInit = {}) {
	const headers = new Headers(init.headers)
	const user = await getAuthUser()

	if (user) {
		const idToken = await user.getIdToken()
		headers.set('Authorization', `Bearer ${idToken}`)
	}

	return fetch(input, {
		...init,
		headers,
	})
}