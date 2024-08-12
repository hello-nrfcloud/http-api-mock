import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, it } from 'node:test'
import { listRequests } from './src/requests.js'
import { registerResponse } from './src/responses.js'

const { responsesTableName, apiURL, requestsTableName } = JSON.parse(
	await readFile(path.join(process.cwd(), 'http-api-mock.json'), 'utf-8'),
)

const db = new DynamoDBClient({})

void describe('end-to-end tests', () => {
	void it('should respond with 404 if no response is configured', async () => {
		const res = await fetch(new URL('/prod/foo', apiURL), {
			method: 'POST',
			body: JSON.stringify({ some: 'data' }),
			headers: {
				'content-type': 'application/json; charset=utf-8',
			},
		})
		assert.equal(res.ok, false)
		assert.equal(res.status, 404)
	})

	void it('should store all requests', async () => {
		const pathSegment = crypto.randomUUID()
		await fetch(new URL(`/prod/${pathSegment}`, apiURL))
		const request = (await listRequests(db, requestsTableName)).find(
			({ path }) => path === pathSegment,
		)
		assert.notEqual(request, undefined)
	})

	void it('should return a configured response', async () => {
		const pathSegment = crypto.randomUUID()
		await registerResponse(db, responsesTableName, {
			method: 'PUT',
			path: pathSegment,
			queryParams: new URLSearchParams({
				foo: 'bar',
			}),
			body: [
				`Content-Type: application/json`,
				'',
				JSON.stringify({ success: true }),
			].join('\n'),
			statusCode: 201,
		})
		const res = await fetch(
			new URL(
				`/prod/${pathSegment}?${new URLSearchParams({ foo: 'bar' }).toString()}`,
				apiURL,
			),
			{
				method: 'PUT',
			},
		)
		assert.equal(res.ok, true)
		assert.equal(res.status, 201)
		assert.equal(res.headers.get('Content-Type'), 'application/json')
		assert.deepEqual(await res.json(), { success: true })
	})
})
