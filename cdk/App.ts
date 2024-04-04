import { App } from 'aws-cdk-lib'
import { HTTPAPIMockStack } from './Stack.js'
import type { PackedLambda } from '@bifravst/aws-cdk-lambda-helpers'
import type { PackedLayer } from '@bifravst/aws-cdk-lambda-helpers/layer'

export class HTTPAPIMockApp extends App {
	public constructor(
		stackName: string,
		{
			lambdaSources,
			layer,
		}: {
			lambdaSources: {
				httpApiMock: PackedLambda
			}
			layer: PackedLayer
		},
	) {
		super({
			context: {
				isTest: true,
			},
		})
		new HTTPAPIMockStack(this, stackName, { lambdaSources, layer })
	}
}
