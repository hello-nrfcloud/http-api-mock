import { PutItemCommand, type DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { sortQueryString } from './sortQueryString.js'

export type Response = {
	// e.g. 'GET'
	method: string
	// without leading slash
	path: string
	queryParams?: Record<string, string>
	statusCode?: number
	body?: string
	ttl?: number
	// Whether to delete the message after sending it
	keep?: boolean
}

export const registerResponse = async (
	db: DynamoDBClient,
	responsesTable: string,
	response: Response,
): Promise<void> => {
	await db.send(
		new PutItemCommand({
			TableName: responsesTable,
			Item: marshall(
				{
					methodPathQuery: `${response.method} ${sortQueryString(response.path)}`,
					timestamp: new Date().toISOString(),
					statusCode: response.statusCode,
					body: response.body,
					queryParams: response.queryParams,
					ttl: response.ttl,
					keep: response.ttl,
				},
				{ removeUndefinedValues: true },
			),
		}),
	)
}
