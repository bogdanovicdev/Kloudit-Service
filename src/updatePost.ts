import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event: any, _context: any) => {
    const postId = event.pathParameters && event.pathParameters.postID;
    const body = JSON.parse(event.body || '{}');
    const content = body.content;

    if (!postId || !content) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "postID and content are required." }),
            headers: {
                'Content-Type': 'application/json',
            },
        };
    }

    try {
        await dynamo.update({
            TableName: "Posts",
            Key: {
                postID: postId
            },
            UpdateExpression: "set content = :content",
            ExpressionAttributeValues: {
                ":content": content
            }
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Post updated successfully." }),
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
