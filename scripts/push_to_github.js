const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  
  const data = await response.json();
  const connectionSettings = data.items?.[0];
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function pushFiles() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  const owner = 'pradeepthalla80';
  const repo = 'grocery-share-frontend';
  const branch = 'main';
  
  const files = [
    { local: 'mobile/lib/services/auth_service.dart', remote: 'mobile/lib/services/auth_service.dart' },
    { local: 'mobile/lib/config/app_config.dart', remote: 'mobile/lib/config/app_config.dart' },
    { local: 'mobile/pubspec.yaml', remote: 'mobile/pubspec.yaml' }
  ];
  
  console.log('Pushing files to GitHub...');
  
  for (const file of files) {
    const content = fs.readFileSync(file.local, 'utf8');
    const contentBase64 = Buffer.from(content).toString('base64');
    
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: file.remote,
        ref: branch
      });
      sha = data.sha;
    } catch (e) {
      sha = undefined;
    }
    
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: file.remote,
      message: `Update ${file.remote} - Unified Google OAuth with flutter_web_auth_2`,
      content: contentBase64,
      sha: sha,
      branch: branch
    });
    
    console.log(`Pushed: ${file.remote}`);
  }
  
  console.log('All files pushed successfully!');
}

pushFiles().catch(console.error);
