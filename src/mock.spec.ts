import type { AttributeValue, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import assert from 'node:assert/strict'
import { describe, it, mock as testMock } from 'node:test'
import { mock } from './mock.js'

void describe('mock()', () => {
	void it('should register a response', async () => {
		const db = {
			send: testMock.fn(async () => Promise.resolve(undefined)),
		}
		const httpApiMock = mock({
			db: db as unknown as DynamoDBClient,
			responsesTable: 'response-table',
		})

		await httpApiMock.response(`GET foo/bar?k=v`, {
			status: 200,
			headers: new Headers({
				'content-type': 'application/json; charset=utf-8',
			}),
			body: JSON.stringify({
				result: 'some-value',
			}),
		})

		assert.equal(db.send.mock.callCount(), 1)
		const [{ input: args }] = db.send.mock.calls[0]?.arguments as unknown as [
			{
				input: {
					TableName: string
					Item: Record<string, AttributeValue>
				}
			},
		]
		assert.equal(args.TableName, 'response-table')
		const { methodPathQuery, statusCode, body, queryParams } = unmarshall(
			args.Item,
		)
		assert.equal(statusCode, 200)
		assert.equal(methodPathQuery, 'GET foo/bar?k=v')
		assert.equal(
			body,
			[
				`content-type: application/json; charset=utf-8`,
				``,
				JSON.stringify({ result: 'some-value' }),
			].join('\n'),
		)
		assert.deepEqual(queryParams, { k: 'v' })
	})
})
