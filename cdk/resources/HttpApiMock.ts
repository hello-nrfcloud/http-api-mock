import type { PackedLambda } from '@bifravst/aws-cdk-lambda-helpers'
import {
	LambdaLogGroup,
	LambdaSource,
} from '@bifravst/aws-cdk-lambda-helpers/cdk'
import {
	aws_apigateway as ApiGateway,
	Duration,
	aws_dynamodb as DynamoDB,
	aws_iam as IAM,
	aws_lambda as Lambda,
	aws_logs as Logs,
	RemovalPolicy,
	Resource,
} from 'aws-cdk-lib'
import type { Construct } from 'constructs'

export class HttpApiMock extends Resource {
	public readonly api: ApiGateway.RestApi
	public readonly requestsTable: DynamoDB.Table
	public readonly responsesTable: DynamoDB.Table

	public constructor(
		parent: Construct,
		{
			lambdaSources,
			layers,
		}: {
			lambdaSources: {
				httpApiMock: PackedLambda
			}
			layers: Lambda.ILayerVersion[]
		},
	) {
		super(parent, 'http-api-mock')

		// This table will store all the requests made to the API Gateway
		this.requestsTable = new DynamoDB.Table(this, 'requests', {
			billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST,
			partitionKey: {
				name: 'requestId',
				type: DynamoDB.AttributeType.STRING,
			},
			sortKey: {
				name: 'timestamp',
				type: DynamoDB.AttributeType.STRING,
			},
			pointInTimeRecovery: true,
			removalPolicy: RemovalPolicy.DESTROY,
		})
		this.requestsTable.addGlobalSecondaryIndex({
			indexName: 'methodPathQuery',
			partitionKey: {
				name: 'methodPathQuery',
				type: DynamoDB.AttributeType.STRING,
			},
			projectionType: DynamoDB.ProjectionType.ALL,
		})

		// This table will store optional responses to be sent
		this.responsesTable = new DynamoDB.Table(this, 'responses', {
			billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST,
			partitionKey: {
				name: 'responseId',
				type: DynamoDB.AttributeType.STRING,
			},
			sortKey: {
				name: 'timestamp',
				type: DynamoDB.AttributeType.STRING,
			},
			pointInTimeRecovery: true,
			removalPolicy: RemovalPolicy.DESTROY,
			timeToLiveAttribute: 'ttl',
		})
		this.responsesTable.addGlobalSecondaryIndex({
			indexName: 'methodPathQuery',
			partitionKey: {
				name: 'methodPathQuery',
				type: DynamoDB.AttributeType.STRING,
			},
			projectionType: DynamoDB.ProjectionType.ALL,
		})

		// This lambda will publish all requests made to the API Gateway in the queue
		const lambda = new Lambda.Function(this, 'Lambda', {
			description:
				'Mocks a HTTP API and stores all requests in SQS for inspection, and optionally replies with enqued responses',
			code: new LambdaSource(this, lambdaSources.httpApiMock).code,
			layers,
			handler: lambdaSources.httpApiMock.handler,
			architecture: Lambda.Architecture.ARM_64,
			runtime: Lambda.Runtime.NODEJS_22_X,
			timeout: Duration.seconds(5),
			environment: {
				REQUESTS_TABLE_NAME: this.requestsTable.tableName,
				RESPONSES_TABLE_NAME: this.responsesTable.tableName,
				LOG_LEVEL: this.node.tryGetContext('logLevel'),
				NODE_NO_WARNINGS: '1',
			},
			...new LambdaLogGroup(this, 'LambdaLogs', Logs.RetentionDays.ONE_DAY),
		})
		this.responsesTable.grantReadWriteData(lambda)
		this.requestsTable.grantReadWriteData(lambda)

		// This is the API Gateway, AWS CDK automatically creates a prod stage and deployment
		this.api = new ApiGateway.RestApi(this, 'api', {
			restApiName: `HTTP Mock API for testing`,
			description: 'API Gateway to test outgoing requests',
			binaryMediaTypes: ['application/octet-stream'],
		})
		const proxyResource = this.api.root.addResource('{proxy+}')
		proxyResource.addMethod('ANY', new ApiGateway.LambdaIntegration(lambda))
		// API Gateway needs to be able to call the lambda
		lambda.addPermission('InvokeByApiGateway', {
			principal: new IAM.ServicePrincipal('apigateway.amazonaws.com'),
			sourceArn: this.api.arnForExecuteApi(),
		})
	}
}
