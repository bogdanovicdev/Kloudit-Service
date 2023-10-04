import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
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
    const body = JSON.parse(event.body || '{}');

    const postID = body.postID;
    const content = body.content;

    if (!postID || !content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Post ID and content are required' }),
      };
    }

    // Prepare the comment data
    const timestamp = new Date().toISOString();
    const commentID = uuidv4();  
    await dynamo.put({
      TableName: COMMENTS_TABLE,
      Item: {
        postID,
        commentID,
        timestamp,
        author: userID,
        content
      },
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Comment added successfully' }),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
}