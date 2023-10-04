import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import * as jwt from 'jsonwebtoken';  // To decode the JWT token

const dynamo = new AWS.DynamoDB.DocumentClient();
const LIKES_TABLE = 'Likes';
const POSTS_TABLE = 'Posts';

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

    if (!postID) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Post ID is required' }),
      };
    }

    const likeParams = {
      TableName: LIKES_TABLE,
      Key: {
        postID,
        userID,
      },
    };

    // Check if the like already exists
    const result = await dynamo.get(likeParams).promise();

    if (result.Item) {
      // If like exists, remove it
      await dynamo.delete(likeParams).promise();

      // Decrement like count in POSTS table
      await dynamo.update({
        TableName: POSTS_TABLE,
        Key: { postID: postID },
        UpdateExpression: 'SET likes_count = likes_count - :val',
        ExpressionAttributeValues: {
          ':val': 1,
        },
      }).promise();

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Post unliked successfully' }),
      };
    } else {
      // If like doesn't exist, add it
      await dynamo.put({
        TableName: LIKES_TABLE,
        Item: {
          postID,
          userID,
          likedAt: new Date().toISOString(),
        },
      }).promise();

      // Increment like count in POSTS table. Adjusting for the possibility likes_count might not exist yet.
      await dynamo.update({
        TableName: POSTS_TABLE,
        Key: { postID: postID },
        UpdateExpression: 'SET likes_count = if_not_exists(likes_count, :zero) + :val',
        ExpressionAttributeValues: {
          ':val': 1,
          ':zero': 0
        },
      }).promise();

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Post liked successfully' }),
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
