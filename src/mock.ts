import type { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { registerResponse } from './responses.js'

type MockResponseFn = (
	// The expected request in the form 'GET resource/subresource?query=value
	methodPathQuery: string,
	// The response
	response: Partial<{
		headers: Headers
		status: number
		body: string
	}>,
	keep?: boolean,
) => Promise<void>

export const mockResponse =
	(db: DynamoDBClient, responsesTable: string): MockResponseFn =>
	async (methodPathQuery, response, keep) => {
		const [method, pathWithQuery] = methodPathQuery.split(' ', 2)
		if (!/^[A-Z]+$/.test(method ?? ''))
			throw new Error(`Invalid method ${method} in ${methodPathQuery}!`)
		if (pathWithQuery === undefined)
			throw new Error(`Missing path in ${methodPathQuery}!`)
		const [path, query] = pathWithQuery.split('?', 2) as [
			string,
			string | undefined,
		]
		if (path.startsWith('/'))
			throw new Error(`Path ${path} must not start with /!`)

		const bodyParts = []
		if (response.headers !== undefined) {
			for (const [k, v] of response.headers.entries()) {
				bodyParts.push(`${k}: ${v}`)
			}
			bodyParts.push('')
		}
		if (response.body !== undefined) bodyParts.push(response.body)
		await registerResponse(db, responsesTable, {
			path,
			method: method ?? 'GET',
			queryParams: new URLSearchParams(query),
			body: bodyParts.length > 0 ? bodyParts.join('\n') : undefined,
			statusCode: response.status,
			keep,
		})
	}

export type HttpAPIMock = {
	response: MockResponseFn
}

export const mock = ({
	db,
	responsesTable,
}: {
	db: DynamoDBClient
	responsesTable: string
}): HttpAPIMock => ({
	response: mockResponse(db, responsesTable),
})
