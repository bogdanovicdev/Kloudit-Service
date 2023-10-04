import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import * as jwt from 'jsonwebtoken';

const dynamo = new AWS.DynamoDB.DocumentClient();
const COMMENTS_TABLE = 'Comments';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = event.headers.Authorization || '';
    const decoded: any = jwt.decode(token);

    if (!decoded || !decoded.sub) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid token' }),
      };
    }

    const userID = decoded.sub;
    const postID = event.pathParameters?.postID;
    const commentID = event.pathParameters?.commentID;
    const body = JSON.parse(event.body || '{}');
    const newContent = body.content;

    if (!postID || !commentID || !newContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Post ID, Comment ID, and new content are required' }),
      };
    }

    await dynamo.update({
      TableName: COMMENTS_TABLE,
      Key: { postID, commentID },
      UpdateExpression: 'SET content = :newContent',
      ExpressionAttributeValues: {
        ':newContent': newContent
      }
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Comment edited successfully' }),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
}
