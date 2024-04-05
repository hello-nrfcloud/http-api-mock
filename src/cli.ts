import { randomString } from './randomString.js'
import run from '@bifravst/run'
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts'
import chalk from 'chalk'
import { stackOutput } from '@nordicsemiconductor/cloudformation-helpers'
import type { StackOutputs } from '../cdk/Stack.js'
import { CloudFormationClient } from '@aws-sdk/client-cloudformation'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const die = (err: Error): void => {
	console.error('')
	console.error(chalk.yellow('⚠️'), chalk.red.bold(err.message))
	console.error('')
	console.error(err)
	process.exit(1)
}

process.on('uncaughtException', die)
process.on('unhandledRejection', die)

const cdkApp = () => [
	'--app',
	`"npx tsx --no-warnings ${path.join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'cdk', 'http-api-mock.ts')}"`,
]

export const cli = async (): Promise<void> => {
	await whoAmI()
	if (process.argv.includes('destroy')) {
		await destroy(getStackNameFromArgs('destroy'))
		return
	}
	if (process.argv.includes('describe')) {
		await describe(getStackNameFromArgs('describe'))
		return
	}
	const stackName = `http-api-mock-${randomString()}`
	console.error(chalk.yellow(`Stack name`), chalk.green(stackName))

	await run({
		command: 'npx',
		args: ['cdk', ...cdkApp(), 'deploy', '--require-approval', 'never'],
		env: {
			...process.env,
			HTTP_API_MOCK_STACK_NAME: stackName,
		},
		log: {
			debug: (msg) => console.error(chalk.blueBright('[CDK]'), chalk.blue(msg)),
		},
	})

	await describe(stackName)
}

const whoAmI = async (): Promise<{ Account: string }> => {
	try {
		const me = await new STSClient({}).send(new GetCallerIdentityCommand({}))

		if (me.Account === undefined) throw new Error(`Not authenticated!`)

		console.error(chalk.yellow('Account'), chalk.green(me.Account))

		return {
			Account: me.Account,
		}
	} catch (err) {
		throw new Error(`Not authenticated!`)
	}
}

const destroy = async (stackName: string) => {
	console.error(chalk.yellow(`Stack name`), chalk.green(stackName))
	await run({
		command: 'npx',
		args: ['cdk', ...cdkApp(), 'destroy', '-f'],
		env: {
			...process.env,
			HTTP_API_MOCK_STACK_NAME: stackName,
		},
		log: {
			debug: (msg) => console.error(chalk.blueBright('[CDK]'), chalk.blue(msg)),
		},
	})

	console.error(chalk.green(`Stack destroyed`))
}

const describe = async (stackName: string) => {
	console.log(
		JSON.stringify(
			{
				stackName,
				...(await stackOutput(new CloudFormationClient({}))<StackOutputs>(
					stackName,
				)),
			},
			null,
			2,
		),
	)
}

const getStackNameFromArgs = (command: string) => {
	const stackName = process.argv[process.argv.indexOf(command) + 1]
	if (stackName === undefined) {
		throw new Error(`Must provide a stack name!`)
	}
	return stackName
}
