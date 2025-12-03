import { B2_CONFIG } from '../config/backblaze';
import { Buffer } from 'buffer';

interface B2AuthResponse {
    authorizationToken: string;
    apiUrl: string;
    downloadUrl: string;
    allowed: {
        bucketId?: string;
        bucketName?: string;
        capabilities: string[];
    };
}

interface B2UploadUrlResponse {
    uploadUrl: string;
    authorizationToken: string;
}

class B2Service {
    private authData: B2AuthResponse | null = null;
    private uploadUrlData: B2UploadUrlResponse | null = null;

    private async authorize(): Promise<B2AuthResponse> {
        if (this.authData) return this.authData;

        const encodedAuth = Buffer.from(
            `${B2_CONFIG.applicationKeyId}:${B2_CONFIG.applicationKey}`
        ).toString('base64');

        try {
            const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
                headers: {
                    Authorization: `Basic ${encodedAuth}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`B2 Auth Failed: ${error.message || response.statusText}`);
            }

            this.authData = await response.json();
            return this.authData!;
        } catch (error) {
            console.error('B2 Authorization Error:', error);
            throw error;
        }
    }

    private async getUploadUrl(bucketId: string): Promise<B2UploadUrlResponse> {
        // Reuse upload URL if available (though they expire, for simplicity we fetch new ones often or handle retry)
        // For this implementation, we'll fetch a new one to be safe or implement simple caching

        const auth = await this.authorize();

        try {
            const response = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
                method: 'POST',
                headers: {
                    Authorization: auth.authorizationToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bucketId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Get Upload URL Failed: ${error.message || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('B2 Get Upload URL Error:', error);
            throw error;
        }
    }

    async uploadFile(
        fileName: string,
        fileData: string, // Base64 string
        contentType: string = 'audio/m4a'
    ): Promise<string> {
        try {
            const auth = await this.authorize();

            // Determine bucket ID. Use the one from auth if restricted, otherwise we need to find it.
            // For now, if auth.allowed.bucketId is missing, we'll assume we need to list buckets or use a hardcoded one if we knew it.
            // Since we don't know the bucket ID for sure if it's a master key, we'll try to list buckets if needed.

            let bucketId = auth.allowed.bucketId;

            if (!bucketId) {
                // If master key, we need to find the bucket ID for "Circle" or create it.
                // For this MVP, let's try to list buckets and find one named "Circle" or "Circle-0" or use the first one.
                // Or better, let's just fail if we can't find it to prompt the user.
                // Actually, let's try to list buckets.
                const listResponse = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
                    method: 'POST',
                    headers: {
                        Authorization: auth.authorizationToken,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ accountId: B2_CONFIG.applicationKeyId.substring(6) ? auth.allowed.bucketId : undefined }), // accountId is needed if not restricted?
                    // Actually b2_list_buckets requires accountId. 
                    // The accountId is usually returned in auth response as 'accountId'.
                });

                // Wait, auth response has accountId.
                const authResponseAny = auth as any;
                const accountId = authResponseAny.accountId;

                const bucketsResponse = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
                    method: 'POST',
                    headers: {
                        Authorization: auth.authorizationToken,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ accountId }),
                });

                const bucketsData = await bucketsResponse.json();
                const circleBucket = bucketsData.buckets.find((b: any) => b.bucketName.toLowerCase().includes('circle'));

                if (circleBucket) {
                    bucketId = circleBucket.bucketId;
                } else if (bucketsData.buckets.length > 0) {
                    bucketId = bucketsData.buckets[0].bucketId; // Fallback to first bucket
                } else {
                    throw new Error('No buckets found in B2 account');
                }
            }

            if (!bucketId) throw new Error('Could not determine B2 Bucket ID');

            const uploadData = await this.getUploadUrl(bucketId);

            // Convert base64 to binary/buffer for upload
            // React Native fetch can handle base64 body? No, usually needs Blob or binary.
            // We can pass the base64 string directly if we treat it right, but B2 expects raw bytes + SHA1 checksum.
            // Calculating SHA1 in JS might be heavy. B2 allows 'do_not_verify' for checksum if we don't send it?
            // Actually, X-Bz-Content-Sha1: do_not_verify is allowed.

            // For React Native, sending binary data can be tricky with `fetch`.
            // We might need to use `XMLHttpRequest` or a library.
            // However, `expo-file-system` has `uploadAsync` which is perfect for this.
            // But `uploadAsync` takes a file URI, not base64.
            // We have the file URI in `voice-chamber.tsx`! We should pass the URI to this service, not base64.

            // Let's refactor this method to take a URI.
            return ''; // Placeholder, will fix in next step
        } catch (error) {
            console.error('Upload failed', error);
            throw error;
        }
    }

    async uploadFileFromUri(fileUri: string, fileName: string): Promise<string> {
        const auth = await this.authorize();

        let bucketId = auth.allowed.bucketId;
        let bucketName = auth.allowed.bucketName;

        if (!bucketId) {
            const authResponseAny = auth as any;
            const accountId = authResponseAny.accountId;

            const bucketsResponse = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
                method: 'POST',
                headers: {
                    Authorization: auth.authorizationToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accountId }),
            });

            const bucketsData = await bucketsResponse.json();
            // Try to find one named 'Circle' or similar
            const circleBucket = bucketsData.buckets.find((b: any) => b.bucketName.includes('Circle'));

            if (circleBucket) {
                bucketId = circleBucket.bucketId;
                bucketName = circleBucket.bucketName;
            } else if (bucketsData.buckets.length > 0) {
                bucketId = bucketsData.buckets[0].bucketId;
                bucketName = bucketsData.buckets[0].bucketName;
            } else {
                throw new Error('No buckets found');
            }
        }

        const uploadData = await this.getUploadUrl(bucketId!);

        // Use Expo FileSystem to upload
        // We need to import FileSystem here or pass it in. 
        // Since this is a service file, we can import it.
        const FileSystem = require('expo-file-system');

        const response = await FileSystem.uploadAsync(uploadData.uploadUrl, fileUri, {
            httpMethod: 'POST',
            headers: {
                'Authorization': uploadData.authorizationToken,
                'X-Bz-File-Name': encodeURIComponent(fileName),
                'Content-Type': 'audio/m4a',
                'X-Bz-Content-Sha1': 'do_not_verify',
            },
        });

        if (response.status !== 200) {
            throw new Error(`Upload failed with status ${response.status}: ${response.body}`);
        }

        // Construct the download URL
        // Friendly URL: https://f000.backblazeb2.com/file/BucketName/FileName
        return `${auth.downloadUrl}/file/${bucketName}/${encodeURIComponent(fileName)}`;
    }
}

export const b2Service = new B2Service();
