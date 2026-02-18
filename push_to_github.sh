#!/bin/bash
echo "=== BaskMate GitHub Push Script ==="
echo ""

TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN}"
if [ -z "$TOKEN" ]; then
  echo "ERROR: GITHUB_PERSONAL_ACCESS_TOKEN not found in secrets!"
  exit 1
fi
echo "Personal Access Token found."

# Push to frontend repo
echo ""
echo "--- Step 1: Pushing to grocery-share-frontend ---"
git remote set-url origin "https://x-access-token:${TOKEN}@github.com/pradeepthalla80/grocery-share-frontend.git"

# Pull remote changes first (merge with local)
echo "Pulling remote changes..."
git pull origin main --no-edit --allow-unrelated-histories 2>&1
if [ $? -ne 0 ]; then
  echo "Pull had conflicts or issues. Trying rebase..."
  git pull origin main --rebase --allow-unrelated-histories 2>&1
fi

git push origin main
if [ $? -eq 0 ]; then
  echo "Frontend push SUCCESS"
else
  echo "Regular push failed. Trying force push..."
  git push origin main --force
  if [ $? -eq 0 ]; then
    echo "Frontend force push SUCCESS"
  else
    echo "Frontend push FAILED"
    exit 1
  fi
fi

# Push backend files to backend repo
echo ""
echo "--- Step 2: Pushing backend to grocery-share-backend ---"

git remote get-url backend 2>/dev/null
if [ $? -ne 0 ]; then
  git remote add backend "https://x-access-token:${TOKEN}@github.com/pradeepthalla80/grocery-share-backend.git"
else
  git remote set-url backend "https://x-access-token:${TOKEN}@github.com/pradeepthalla80/grocery-share-backend.git"
fi

git subtree push --prefix=grocery-share-backend-main_12_26_2025 backend main 2>&1
if [ $? -eq 0 ]; then
  echo "Backend push SUCCESS"
else
  echo ""
  echo "Subtree push had issues. Trying force split + push..."
  git branch -D backend-split 2>/dev/null
  git subtree split --prefix=grocery-share-backend-main_12_26_2025 -b backend-split 2>&1
  if [ $? -eq 0 ]; then
    git push backend backend-split:main --force
    git branch -D backend-split 2>/dev/null
    echo "Backend force push SUCCESS"
  else
    echo "Backend push FAILED."
  fi
fi

echo ""
echo "=== Done! ==="
echo "Frontend: https://github.com/pradeepthalla80/grocery-share-frontend"
echo "Backend: https://github.com/pradeepthalla80/grocery-share-backend"
