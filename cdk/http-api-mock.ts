import { packLambdaFromPath } from '@bifravst/aws-cdk-lambda-helpers'
import { packLayer } from '@bifravst/aws-cdk-lambda-helpers/layer'
import { fromEnv } from '@bifravst/from-env'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pJSON from '../package.json' assert { type: 'json' }
import { HTTPAPIMockApp } from './App.js'

const { stackName } = fromEnv({ stackName: 'HTTP_API_MOCK_STACK_NAME' })(
	process.env,
)

const baseDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = await fs.mkdtemp(path.join(os.tmpdir(), 'temp-'))
const lambdasDir = path.join(distDir, 'lambdas')
await fs.mkdir(lambdasDir)
const layersDir = path.join(distDir, 'layers')
await fs.mkdir(layersDir)

const dependencies: Array<keyof (typeof pJSON)['dependencies']> = [
	'@bifravst/from-env',
]

new HTTPAPIMockApp(stackName, {
	lambdaSources: {
		httpApiMock: await packLambdaFromPath({
			id: 'httpApiMock',
			sourceFilePath: 'cdk/resources/http-api-mock-lambda.ts',
			baseDir,
			distDir: lambdasDir,
		}),
	},
	layer: await packLayer({
		id: 'testResources',
		dependencies,
		baseDir,
		distDir: layersDir,
	}),
})
