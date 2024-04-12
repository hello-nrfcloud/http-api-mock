import { packLayer } from '@bifravst/aws-cdk-lambda-helpers/layer'
import { packLambdaFromPath } from '@bifravst/aws-cdk-lambda-helpers'
import { HTTPAPIMockApp } from './App.js'
import { fromEnv } from '@nordicsemiconductor/from-env'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import os from 'node:os'

const { stackName } = fromEnv({ stackName: 'HTTP_API_MOCK_STACK_NAME' })(
	process.env,
)

const baseDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = await fs.mkdtemp(path.join(os.tmpdir(), 'temp-'))
const lambdasDir = path.join(distDir, 'lambdas')
await fs.mkdir(lambdasDir)
const layersDir = path.join(distDir, 'layers')
await fs.mkdir(layersDir)

new HTTPAPIMockApp(stackName, {
	lambdaSources: {
		httpApiMock: await packLambdaFromPath(
			'httpApiMock',
			'cdk/resources/http-api-mock-lambda.ts',
			undefined,
			baseDir,
			lambdasDir,
		),
	},
	layer: await packLayer({
		id: 'testResources',
		dependencies: ['@aws-sdk/client-dynamodb', '@nordicsemiconductor/from-env'],
		baseDir,
		distDir: layersDir,
	}),
})
