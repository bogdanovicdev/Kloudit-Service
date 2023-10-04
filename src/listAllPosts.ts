const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event:any) => {
    let body, statusCode = '200';
    const headers = {
        'Content-Type': 'application/json'
    };

    try {
        switch (event.httpMethod) {
            case 'GET':
                body = await dynamo.scan({
                    TableName: "Posts"
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
