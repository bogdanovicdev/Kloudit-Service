import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';

const cognito = new CognitoIdentityServiceProvider();

const USER_POOL_ID = 'your_user_pool_id'; // replace with your User Pool ID
const CLIENT_ID = 'your_client_id'; // replace with your App Client ID

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { username, confirmationCode, newPassword } = body;

    if (!username || !confirmationCode || !newPassword) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Username, confirmation code, and new password are required' }),
      };
    }

    await cognito.confirmForgotPassword({
      Username: username,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
      ClientId: CLIENT_ID,
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Password changed successfully' }),
    };

  } catch (error) {
    console.error('Error in confirming password reset:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
