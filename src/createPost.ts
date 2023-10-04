const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event:any) => {
    let body, statusCode = '200';
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // This is the CORS header
    };

    try {
        switch (event.httpMethod) {
            case 'POST':
                body = await dynamo.put({
                    TableName: "Posts",
                    Item: JSON.parse(event.body)
                }).promise();
                break;
            default:
                throw new Error(`Unsupported method "${event.httpMethod}"`);
        }
    } catch (err:any) {
        statusCode = '400';
        body = err.message;
    } finally {
        body = JSON.stringify(body);
    }

    return {
        statusCode,
        body,
        headers,
    };
};
export {};