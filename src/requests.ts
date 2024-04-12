import { ScanCommand, type DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

export type Request = {
	path: string //e.g.'555c3960-2092-438b-b2b0-f28eebd1f5bb'
	query: null
	timestamp: string //e.g.'2024-04-05T13:01:14.434Z'
	ttl: string //e.g. 1712322374
	headers: Record<string, string> //e.g. '{"Accept":"*/*","Accept-Encoding":"br, gzip, deflate","Accept-Language":"*","CloudFront-Forwarded-Proto":"https","CloudFront-Is-Desktop-Viewer":"true","CloudFront-Is-Mobile-Viewer":"false","CloudFront-Is-SmartTV-Viewer":"false","CloudFront-Is-Tablet-Viewer":"false","CloudFront-Viewer-ASN":"2116","CloudFront-Viewer-Country":"NO","Host":"idj1fffo0k.execute-api.eu-west-1.amazonaws.com","sec-fetch-mode":"cors","User-Agent":"node","Via":"1.1 b053873243f91b1bb6dc406ce0c67db4.cloudfront.net (CloudFront)","X-Amz-Cf-Id":"_vJIGo6Z89QxDzoqOZL4G0PQqPFWGesVXVan4ND934_Urqn2ifSOsQ==","X-Amzn-Trace-Id":"Root=1-660ff61a-25e1219a7f153e1b0c768358","X-Forwarded-For":"194.19.86.146, 130.176.182.18","X-Forwarded-Port":"443","X-Forwarded-Proto":"https"}'
	method: string //e.g.'GET'
	requestId: string //e.g.'f34b042b-e9a2-4089-97a2-241516d40d64'
	body: string //e.g.'{}'
	methodPathQuery: string //e.g.'GET 555c3960-2092-438b-b2b0-f28eebd1f5bb'
}

export const listRequests = async (
	db: DynamoDBClient,
	requestsTable: string,
): Promise<Array<Request>> =>
	((await db.send(new ScanCommand({ TableName: requestsTable }))).Items ?? [])
		.map((item) => {
			const i = unmarshall(item)
			return {
				...i,
				headers: JSON.parse(i.headers),
			} as Request
		})
		.sort((i1, i2) => i1.timestamp.localeCompare(i2.timestamp))
