import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event: any, _context: any) => {
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
        await dynamo.delete({
            TableName: "Posts",
            Key: {
                postID: postId
            }
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Post deleted successfully." }),
            headers: {
                'Content-Type': 'application/json',
            },
        };
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
