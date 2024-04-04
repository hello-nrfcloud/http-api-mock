import { packLayer } from '@bifravst/aws-cdk-lambda-helpers/layer'
import { packLambdaFromPath } from '@bifravst/aws-cdk-lambda-helpers'
import { HTTPAPIMockApp } from './App.js'
import { fromEnv } from '@nordicsemiconductor/from-env'

const { stackName } = fromEnv({ stackName: 'STACK_NAME' })(process.env)

new HTTPAPIMockApp(stackName, {
	lambdaSources: {
		httpApiMock: await packLambdaFromPath(
			'httpApiMock',
			'cdk/resources/http-api-mock-lambda.ts',
		),
	},
	layer: await packLayer({
		id: 'testResources',
		dependencies: [
			'@aws-sdk/client-dynamodb',
			'@nordicsemiconductor/from-env',
			'@hello.nrfcloud.com/lambda-helpers',
		],
	}),
})
