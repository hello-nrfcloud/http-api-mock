import type { PackedLambda } from '@bifravst/aws-cdk-lambda-helpers'
import { LambdaSource } from '@bifravst/aws-cdk-lambda-helpers/cdk'
import type { PackedLayer } from '@bifravst/aws-cdk-lambda-helpers/layer'
import type { App } from 'aws-cdk-lib'
import { CfnOutput, aws_lambda as Lambda, Stack } from 'aws-cdk-lib'
import { HttpApiMock } from './resources/HttpApiMock.js'

/**
 * This is CloudFormation stack sets up a dummy HTTP API which stores all requests in SQS for inspection
 */
export class HTTPAPIMockStack extends Stack {
	public constructor(
		parent: App,
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
		super(parent, stackName, {
			description:
				'Provides a mock HTTP API for testing third-party API integrations.',
		})

		const baseLayer = new Lambda.LayerVersion(this, 'baseLayer', {
			layerVersionName: `${Stack.of(this).stackName}-baseLayer`,
			code: new LambdaSource(this, {
				id: 'baseLayer',
				zipFile: layer.layerZipFile,
				hash: layer.hash,
			}).code,
			compatibleArchitectures: [Lambda.Architecture.ARM_64],
			compatibleRuntimes: [Lambda.Runtime.NODEJS_22_X],
		})

		const httpMockApi = new HttpApiMock(this, {
			lambdaSources,
			layers: [baseLayer],
		})

		// Export these so the test runner can use them
		new CfnOutput(this, 'apiURL', {
			value: httpMockApi.api.url,
			exportName: `${this.stackName}:apiURL`,
		})
		new CfnOutput(this, 'responsesTableName', {
			value: httpMockApi.responsesTable.tableName,
			exportName: `${this.stackName}:responsesTableName`,
		})
		new CfnOutput(this, 'requestsTableName', {
			value: httpMockApi.requestsTable.tableName,
			exportName: `${this.stackName}:requestsTableName`,
		})
	}
}

export type StackOutputs = {
	apiURL: string
	requestsTableName: string
	responsesTableName: string
}
