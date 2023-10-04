import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event:any, _context:any) => {
    const postId = event.pathParameters && event.pathParameters.postID;

    if (!postId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "postID is required." }),
            headers: {
                'Content-Type': 'application/json',
            },
        };
    }

    try {
        const result = await dynamo.get({
            TableName: "Posts",
            Key: {
                postID: postId
            }
        }).promise();

        if (result.Item) {
            return {
                statusCode: 200,
                body: JSON.stringify(result.Item),
                headers: {
                    'Content-Type': 'application/json',
                },
            };
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "Post not found." }),
                headers: {
                    'Content-Type': 'application/json',
                },
            };
        }

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
            headers: {
                'Content-Type': 'application/json',
            },
        };
    }
};
