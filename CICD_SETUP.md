# CI/CD Setup Summary

## ✅ Step 4: Dockerfile Verification

Your Dockerfile is **correctly implemented** with the following features:

- ✅ Multi-stage build for optimized image size
- ✅ Node.js 20 Alpine base image
- ✅ Standalone output configuration
- ✅ Cloud Run compatibility (PORT 8080)
- ✅ Security best practices (non-root user)
- ✅ Firebase environment variables support
- ✅ Proper layer caching for efficient builds

**Note:** Your Dockerfile uses Node 20 instead of the suggested Node 18.17.0, which is fine and even better as it's more recent.

## ✅ Step 5: GitHub Actions CI/CD

The workflow file has been created at: `.github/workflows/cloud-run-deploy.yml`

### Required GitHub Secrets

Before pushing to GitHub, you need to set up these secrets in your repository:

1. **Navigate to:** Repository → Settings → Secrets and variables → Actions → Secrets tab → New repository secret

2. **Create the following secrets:**

   - **GCP_SA_KEY**: Your entire JSON of Service Account Key
   - **GCP_PROJECT_ID**: Your GCP Project ID  
   - **DOCKER_IMAGE_NAME**: Your preferred Docker image name (e.g., `cummins-nextjs-app`)

### Workflow Configuration

The workflow will:
- ✅ Trigger on push/PR to `main` branch
- ✅ Checkout your code
- ✅ Authenticate with Google Cloud
- ✅ Build Docker image
- ✅ Push to Google Container Registry (GCR)
- ✅ Deploy to Cloud Run

### Service Name

The service is configured as: `next-app-project`

**⚠️ Important Note:** As mentioned in your instructions, for the **first deployment**, you may need to remove the service name from the deploy command. After the first deployment, the service name will work correctly.

### Environment Variables for Cloud Run

If your app needs environment variables (like Firebase credentials) at runtime, you'll need to add them to the Cloud Run deployment. You can do this by modifying the "Deploy to Cloud Run" step:

```yaml
- name: Deploy to Cloud Run
  run: |
    gcloud run deploy $SERVICE_NAME \
      --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/${{ secrets.DOCKER_IMAGE_NAME }}:latest \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars="NEXT_PUBLIC_FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }},NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${{ secrets.FIREBASE_AUTH_DOMAIN }},NEXT_PUBLIC_FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }}"
```

## Next Steps

1. **Set up GitHub Secrets** (as described above)
2. **Commit and push** your code to GitHub:
   ```bash
   git add .
   git commit -m "Add CI/CD workflow for Cloud Run deployment"
   git push origin main
   ```
3. **Monitor the deployment** in the Actions tab of your GitHub repository
4. **First deployment**: If this is your first deployment, you may need to adjust the service name as noted above

## Testing Locally

To test the Docker build locally before pushing:

```bash
# Build the image
docker build -t cummins-nextjs-app .

# Run the container
docker run -p 8080:8080 cummins-nextjs-app
```

Then visit http://localhost:8080 to verify everything works.

## Troubleshooting

- **Build ARG errors**: If you see errors about missing build arguments during Docker build, you may need to pass them:
  ```bash
  docker build --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=your_key -t cummins-nextjs-app .
  ```

- **First deployment fails**: Remove `$SERVICE_NAME` from the gcloud run deploy command for the first deployment

- **Authentication issues**: Verify your GCP_SA_KEY secret contains valid JSON

---

Your CI/CD pipeline is now ready! 🚀
