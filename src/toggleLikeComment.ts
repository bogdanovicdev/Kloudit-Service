import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import * as jwt from 'jsonwebtoken';

const dynamo = new AWS.DynamoDB.DocumentClient();
const COMMENT_LIKES_TABLE = 'CommentLikes';
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

    if (!postID || !commentID) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Post ID and Comment ID are required' }),
      };
    }

    const likeParams = {
      TableName: COMMENT_LIKES_TABLE,
      Key: {
        commentID,
        userID,
      },
    };

    // Check if the like for the comment already exists
    const result = await dynamo.get(likeParams).promise();

    if (result.Item) {
      // If like exists, remove it
      await dynamo.delete(likeParams).promise();

      // Decrement like count in COMMENTS table
      await dynamo.update({
        TableName: COMMENTS_TABLE,
        Key: { postID, commentID },
        UpdateExpression: 'SET #likesCount = if_not_exists(#likesCount, :zero) - :val',
        ExpressionAttributeValues: {
          ':val': 1,
          ':zero': 0  // <-- Added this
        },
        ExpressionAttributeNames: {   // <-- Added this block
            '#likesCount': 'likes_count'
        }
    }).promise();    

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Comment unliked successfully' }),
      };
    } else {
      // If like doesn't exist, add it
      await dynamo.put({
        TableName: COMMENT_LIKES_TABLE,
        Item: {
          commentID,
          userID,
          likedAt: new Date().toISOString(),
        },
      }).promise();

      // Increment like count in COMMENTS table
      await dynamo.update({
        TableName: COMMENTS_TABLE,
        Key: { postID, commentID },
        UpdateExpression: 'SET #likesCount = if_not_exists(#likesCount, :zero) + :val',
        ExpressionAttributeValues: {
          ':val': 1,
          ':zero': 0  // <-- Added this
        },
        ExpressionAttributeNames: {   // <-- Added this block
            '#likesCount': 'likes_count'
        }
    }).promise();
    

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Comment liked successfully' }),
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
