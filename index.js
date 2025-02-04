const core = require('@actions/core');
const ssm = require('./ssm-helper');
const fs = require('fs');

async function run_action()
{
    try
    {
        const ssmPath = core.getInput('ssm-path', { required: true });
        const getChildren = core.getInput('get-children') === 'true';
        const prefix = core.getInput('prefix');
        const region = process.env.AWS_DEFAULT_REGION;
        const decryption = core.getInput('decryption') === 'true';
        const maskValues = core.getInput('mask-values') === 'true';
        const outFile = core.getInput('out-file');
        let outFileStr = "";
        const params = await ssm.getParameters(ssmPath, getChildren, decryption, region);
        for (let param of params)
        {
            const parsedValue = parseValue(param.Value);
            if (typeof(parsedValue) === 'object') // Assume JSON object
            {
                core.debug(`parsedValue: ${JSON.stringify(parsedValue)}`);
                // Assume basic JSON structure
                for (var key in parsedValue)
                {
                    const k = prefix + key;
                    outFileStr = outFileStr + k + "=" + parsedValue[key] + '\n';
                    setEnvironmentVar(k, parsedValue[key], maskValues);
                }
            }
            else
            {
                core.debug(`parsedValue: ${parsedValue}`);
                // Set environment variable with ssmPath name as the env variable
                var split = param.Name.split('/');
                var envVarName = prefix + split[split.length - 1];
                core.debug(`Using prefix + end of ssmPath for env var name: ${envVarName}`);
                
                outFileStr = outFileStr + envVarName + "=" + parsedValue + '\n';
                setEnvironmentVar(envVarName, parsedValue, maskValues);
            }
        }

        if (outFile) {
            core.info(`Writing to file: ${outFile}`);
            core.info(`outFileStr: ${outFileStr}`);
            fs.writeFileSync(outFile, outFileStr);
        }
    }
    catch (e)
    {
        core.setFailed(e.message);
    }
}


function parseValue(val)
{
    try
    {
        return JSON.parse(val);
    }
    catch
    {
        core.debug('JSON parse failed - assuming parameter is to be taken as a string literal');
        return val;
    }
}

function setEnvironmentVar(key, value, maskValue)
{
    if (maskValue) {
        core.setSecret(value);
    }
    core.exportVariable(key, value);
}

run_action();