import crypto from 'node:crypto'

export const randomString = (): string =>
	crypto
		.randomBytes(Math.ceil(8 * 0.5))
		.toString('hex')
		.slice(0, 8)
