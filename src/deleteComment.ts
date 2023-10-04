import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import * as jwt from 'jsonwebtoken';

const dynamo = new AWS.DynamoDB.DocumentClient();
const COMMENTS_TABLE = 'Comments';
const COMMENT_LIKES_TABLE = 'CommentLikes';

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

    const postID = event.pathParameters?.postID;
    const commentID = event.pathParameters?.commentID;

    if (!postID || !commentID) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Post ID and Comment ID are required' }),
      };
    }

    // Remove associated likes
    const likes = await dynamo.query({
      TableName: COMMENT_LIKES_TABLE,
      KeyConditionExpression: "commentID = :commentID",
      ExpressionAttributeValues: {
        ":commentID": commentID
      }
    }).promise();

    const deleteLikesPromises = likes.Items?.map((like) => {
      return dynamo.delete({
        TableName: COMMENT_LIKES_TABLE,
        Key: {
          commentID: like.commentID,
          userID: like.userID
        }
      }).promise();
    });

    if (deleteLikesPromises && deleteLikesPromises.length > 0) {
      await Promise.all(deleteLikesPromises);
    }

    // Now, delete the comment itself
    await dynamo.delete({
      TableName: COMMENTS_TABLE,
      Key: { postID, commentID }
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Comment and associated likes deleted successfully' }),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
}
