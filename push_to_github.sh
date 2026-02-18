#!/bin/bash
echo "=== BaskMate GitHub Push Script ==="
echo ""

TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN}"
if [ -z "$TOKEN" ]; then
  echo "ERROR: GITHUB_PERSONAL_ACCESS_TOKEN not found in secrets!"
  exit 1
fi
echo "Personal Access Token found."

# Push to frontend repo (current remote)
echo ""
echo "--- Step 1: Pushing to grocery-share-frontend ---"
git remote set-url origin "https://x-access-token:${TOKEN}@github.com/pradeepthalla80/grocery-share-frontend.git"
git push origin main
if [ $? -eq 0 ]; then
  echo "Frontend push SUCCESS"
else
  echo "Frontend push FAILED"
  exit 1
fi

# Push backend files to backend repo using subtree
echo ""
echo "--- Step 2: Pushing backend to grocery-share-backend ---"

# Check if backend remote exists, add if not
git remote get-url backend 2>/dev/null
if [ $? -ne 0 ]; then
  git remote add backend "https://x-access-token:${TOKEN}@github.com/pradeepthalla80/grocery-share-backend.git"
else
  git remote set-url backend "https://x-access-token:${TOKEN}@github.com/pradeepthalla80/grocery-share-backend.git"
fi

# Push the backend subdirectory as a subtree
git subtree push --prefix=grocery-share-backend-main_12_26_2025 backend main 2>&1
if [ $? -eq 0 ]; then
  echo "Backend push SUCCESS"
else
  echo ""
  echo "Subtree push had issues. Trying force split + push..."
  # Alternative: split and force push
  SPLIT_SHA=$(git subtree split --prefix=grocery-share-backend-main_12_26_2025 -b backend-split 2>&1)
  if [ $? -eq 0 ]; then
    git push backend backend-split:main --force
    git branch -D backend-split 2>/dev/null
    echo "Backend force push SUCCESS"
  else
    echo "Backend push FAILED. You may need to push backend manually."
    echo "Error: $SPLIT_SHA"
  fi
fi

echo ""
echo "=== Done! ==="
echo "Frontend: https://github.com/pradeepthalla80/grocery-share-frontend"
echo "Backend: https://github.com/pradeepthalla80/grocery-share-backend"
echo "Vercel should auto-deploy the frontend shortly."
