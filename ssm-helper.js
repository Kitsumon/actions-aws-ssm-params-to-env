const AWS = require('aws-sdk');

const getParameters = async (ssmPath, getChildren, decryption, region) => {
    AWS.config.update({region: region});
    const ssm = new AWS.SSM();
    let params;
    const ssmParams = [];

    let promise;
    let nextToken;
    while(!promise) {
        if (getChildren)
        {
            params =
            {
                Path: ssmPath,
                WithDecryption: decryption,
                NextToken: nextToken
            };
            promise = ssm.getParametersByPath(params).promise();
        }
        else
        {
            params =
            {
                Names: [ssmPath],
                WithDecryption: decryption,                
                NextToken: nextToken
            };
            promise = ssm.getParameters(params).promise();
        }

        const result = await promise;
        ssmParams.push(...result.Parameters);
        if (result.NextToken)
        {
            nextToken = result.NextToken;
            promise = null;
        }
    }
    return ssmParams;
}

module.exports = {getParameters};