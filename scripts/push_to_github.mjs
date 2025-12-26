import fs from 'fs';

async function getFileSha(token, owner, repo, path) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Replit-Push-Script'
        }
      }
    );
    if (response.ok) {
      const data = await response.json();
      return data.sha;
    }
  } catch (e) {}
  return null;
}

async function updateFile(token, owner, repo, path, content, message, sha) {
  const body = {
    message: message,
    content: Buffer.from(content).toString('base64'),
    branch: 'main'
  };
  if (sha) {
    body.sha = sha;
  }
  
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Replit-Push-Script',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update ${path}: ${response.status} ${error}`);
  }
  
  return await response.json();
}

async function pushFiles() {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  
  if (!token) {
    throw new Error('GITHUB_PERSONAL_ACCESS_TOKEN not found in environment');
  }
  
  const owner = 'pradeepthalla80';
  const repo = 'grocery-share-frontend';
  
  const files = [
    { local: 'mobile/lib/services/auth_service.dart', remote: 'mobile/lib/services/auth_service.dart' },
    { local: 'mobile/lib/config/app_config.dart', remote: 'mobile/lib/config/app_config.dart' },
    { local: 'mobile/pubspec.yaml', remote: 'mobile/pubspec.yaml' }
  ];
  
  console.log('Pushing files to GitHub...');
  
  for (const file of files) {
    const content = fs.readFileSync(file.local, 'utf8');
    const sha = await getFileSha(token, owner, repo, file.remote);
    
    await updateFile(
      token, owner, repo, file.remote, content,
      `Update ${file.remote} - Unified Google OAuth with flutter_web_auth_2`,
      sha
    );
    
    console.log(`Pushed: ${file.remote}`);
  }
  
  console.log('All files pushed successfully!');
}

pushFiles().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
