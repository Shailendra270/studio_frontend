# Debug Upload Issues Guide

## Current Issue: "Failed to upload file to storage"

The `uploadFileToPresignedUrl` function is failing. Here's a systematic approach to debug and fix the issue.

## Enhanced Debugging (Already Implemented)

The `uploadFileToPresignedUrl` function in `src/api/assetApi.ts` has been enhanced with detailed logging:

- File upload details (name, size, type)
- HTTP response status and headers
- Detailed error messages
- Network error stack traces

## Common Causes and Solutions

### 1. CORS Issues

**Symptoms:**
- Browser console shows CORS errors
- Network tab shows preflight OPTIONS requests failing

**Solution:**
Ensure GCP bucket CORS is configured correctly. Check `env_config/gcp-bucket-cors-setup.md` for proper configuration.

**Required CORS settings:**
```json
[
  {
    "origin": [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "https://Studio.ai"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "x-goog-resumable"
    ],
    "maxAgeSeconds": 3600
  }
]
```

### 2. Presigned URL Issues

**Symptoms:**
- 403 Forbidden errors
- 400 Bad Request errors
- URL appears malformed

**Potential Causes:**
- Expired presigned URL (expires in 1 hour)
- Incorrect Content-Type header
- Missing GCP service account file
- Wrong bucket permissions

### 3. Network/Connectivity Issues

**Symptoms:**
- Network timeout errors
- Connection refused errors
- DNS resolution failures

**Debug Steps:**
1. Check if backend API is accessible: `http://35.200.219.105:5000/api/assets/presigned-url`
2. Verify GCP bucket accessibility
3. Test with curl command

### 4. File Size/Type Issues

**Symptoms:**
- Large files failing to upload
- Specific file types failing

**Solutions:**
- Check file size limits
- Verify Content-Type matching
- Ensure file is not corrupted

## Debugging Steps

### Step 1: Check Browser Console

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Try uploading a file
4. Look for:
   - Enhanced logging from `uploadFileToPresignedUrl`
   - CORS errors
   - Network errors
   - 4xx/5xx HTTP status codes

### Step 2: Check Network Tab

1. Go to Network tab in Developer Tools
2. Try uploading a file
3. Look for:
   - Failed requests (red entries)
   - OPTIONS preflight requests
   - PUT request to GCS storage
   - Response status codes and headers

### Step 3: Test Backend API

```bash
# Test presigned URL generation
curl -X POST http://35.200.219.105:5000/api/assets/presigned-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "test123",
    "fileName": "test-video.mp4",
    "contentType": "video/mp4"
  }'
```

### Step 4: Test Direct Upload

```bash
# Test direct upload to presigned URL (replace with actual URL)
curl -X PUT "PRESIGNED_URL_HERE" \
  -H "Content-Type: video/mp4" \
  --data-binary @test-video.mp4
```

## Quick Fixes to Try

### Fix 1: Update CORS Configuration

Run this command to update GCP bucket CORS:

```bash
gsutil cors set cors.json gs://gcp-mulistream-dev
```

### Fix 2: Verify Backend Service

Ensure the backend service is running and accessible:

```bash
# Check if backend is running
curl http://35.200.219.105:5000/health

# Check if GCP credentials are working
curl http://35.200.219.105:5000/api/test/url-demo
```

### Fix 3: Clear Browser Cache

1. Clear browser cache and cookies
2. Hard refresh (Ctrl+F5)
3. Try in incognito/private mode

## Expected Console Output

With the enhanced logging, you should see:

```javascript
// Successful upload
Starting file upload to presigned URL: {
  fileName: "video.mp4",
  fileSize: 1048576,
  fileType: "video/mp4",
  presignedUrlLength: 500
}

Upload response: {
  status: 200,
  statusText: "OK",
  ok: true,
  headers: {...}
}

// Failed upload
Upload failed with response: {
  status: 403,
  statusText: "Forbidden",
  errorBody: "Access denied"
}
```

## Next Steps

1. **Immediate**: Check browser console for enhanced error logs
2. **Short-term**: Verify CORS configuration on GCP bucket
3. **Long-term**: Implement retry logic and better error handling

## Contact Information

If issues persist:
1. Share browser console logs
2. Share network tab screenshots
3. Provide specific error messages
4. Include file details (size, type, name)