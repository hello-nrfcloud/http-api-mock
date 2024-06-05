import {
	DeleteItemCommand,
	DynamoDBClient,
	PutItemCommand,
	ScanCommand,
} from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import type {
	APIGatewayEvent,
	APIGatewayProxyResult,
	Context,
} from 'aws-lambda'
import { URLSearchParams } from 'url'
import { checkMatchingQueryParams } from './checkMatchingQueryParams.js'
import { splitMockResponse } from './splitMockResponse.js'
import { sortQueryString } from '../../src/sortQueryString.js'
import { URLSearchParamsToObject } from '../../src/URLSearchParamsToObject.js'

const db = new DynamoDBClient({})

export const handler = async (
	event: APIGatewayEvent,
	context: Context,
): Promise<APIGatewayProxyResult> => {
	console.log(JSON.stringify({ event }))
	const query =
		event.queryStringParameters !== null &&
		event.queryStringParameters !== undefined
			? new URLSearchParams(
					event.queryStringParameters as Record<string, string>,
				)
			: undefined
	const path = event.path.replace(/^\//, '')
	const pathWithQuery = sortQueryString(
		`${path}${query !== undefined ? `?${query.toString()}` : ''}`,
	)

	await db.send(
		new PutItemCommand({
			TableName: process.env.REQUESTS_TABLE_NAME,
			Item: marshall({
				methodPathQuery: `${event.httpMethod} ${pathWithQuery}`,
				timestamp: new Date().toISOString(),
				requestId: context.awsRequestId,
				method: event.httpMethod,
				path,
				query: query === undefined ? null : URLSearchParamsToObject(query),
				body: event.body ?? '{}',
				headers: JSON.stringify(event.headers),
				ttl: Math.round(Date.now() / 1000) + 5 * 60,
			}),
		}),
	)

	// Check if response exists
	console.debug(
		`Checking if response exists for ${event.httpMethod} ${pathWithQuery}...`,
	)
	// Scan using httpMethod and path only so query strings can be partially matched
	const { Items } = await db.send(
		new ScanCommand({
			TableName: process.env.RESPONSES_TABLE_NAME,
			FilterExpression: 'begins_with(methodPathQuery, :methodPath)',
			ExpressionAttributeValues: {
				[':methodPath']: {
					S: `${event.httpMethod} ${path}`,
				},
			},
		}),
	)
	console.debug(
		`Found response items beginning with same path: ${Items?.length}`,
	)
	// use newest response first
	const itemsByTimestampDesc = (Items ?? [])
		.map((Item) => unmarshall(Item))
		.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

	let res: APIGatewayProxyResult | undefined
	for (const objItem of itemsByTimestampDesc) {
		const hasExpectedQueryParams =
			'queryParams' in objItem || query !== undefined
		const matchedQueryParams = hasExpectedQueryParams
			? checkMatchingQueryParams(
					event.queryStringParameters,
					objItem.queryParams,
				)
			: true
		if (matchedQueryParams === false) continue

		console.debug(`Matched response`, JSON.stringify({ response: objItem }))

		if (
			objItem?.methodPathQuery !== undefined &&
			objItem?.timestamp !== undefined &&
			objItem?.keep !== true
		) {
			await db.send(
				new DeleteItemCommand({
					TableName: process.env.RESPONSES_TABLE_NAME,
					Key: marshall({
						methodPathQuery: objItem.methodPathQuery,
						timestamp: objItem.timestamp,
					}),
				}),
			)
		}

		const { body, headers } = splitMockResponse(objItem.body ?? '')

		// Send as binary, if mock response is HEX encoded. See https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-payload-encodings.html
		const isBinary = /^[0-9a-f]+$/.test(body)
		res = {
			statusCode: objItem.statusCode ?? 200,
			headers: isBinary
				? {
						...headers,
						'Content-Type': 'application/octet-stream',
					}
				: headers,
			body: isBinary
				? /* body is HEX encoded */ Buffer.from(body, 'hex').toString('base64')
				: body,
			isBase64Encoded: isBinary,
		}
		console.debug(`Return response`, JSON.stringify({ response: res }))

		break
	}

	if (res !== undefined) {
		return res
	}

	console.debug('No responses found')
	return { statusCode: 404, body: '' }
}
