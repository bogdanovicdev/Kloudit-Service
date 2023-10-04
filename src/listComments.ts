import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();
const COMMENTS_TABLE = 'Comments';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const postID = event.queryStringParameters?.postID;

        if (!postID) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Post ID is required' }),
            };
        }

        const comments = await dynamo.query({
            TableName: COMMENTS_TABLE,
            KeyConditionExpression: 'postID = :postIDValue',
            ExpressionAttributeValues: {
                ':postIDValue': postID
            },
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ comments: comments.Items }),
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
