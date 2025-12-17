// Pixlr Integration - Handle uploads from Pixlr and upload to Roblox
class PixlrIntegration {
    constructor() {
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('cape-file-input');
        this.progressDiv = document.getElementById('upload-progress');
        this.resultDiv = document.getElementById('upload-result');
        this.progressFill = document.getElementById('progress-fill');
        this.init();
    }

    init() {
        // Check if Pixlr iframe loads
        this.checkPixlrIframe();
        
        // Setup file upload
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                this.handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        // Copy buttons
        document.getElementById('copy-asset-id')?.addEventListener('click', () => {
            this.copyToClipboard(document.getElementById('asset-id').textContent, 'Asset ID');
        });

        document.getElementById('copy-image-id')?.addEventListener('click', () => {
            this.copyToClipboard(document.getElementById('image-id').textContent, 'Image ID');
        });

        // Listen for messages from Pixlr iframe (if they support postMessage)
        window.addEventListener('message', (e) => {
            if (e.origin === 'https://pixlr.com') {
                console.log('Message from Pixlr:', e.data);
                // Handle Pixlr export events if available
            }
        });
    }

    checkPixlrIframe() {
        // Pixlr X iframe - embedded directly in page
        const iframe = document.getElementById('pixlr-editor');
        
        if (!iframe) return;
        
        // Iframe is embedded directly - no fallback needed
        iframe.addEventListener('load', () => {
            console.log('Pixlr X loaded successfully');
        });
    }

    async handleFileUpload(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (PNG, JPEG, etc.)');
            return;
        }

        // Show progress
        this.resultDiv.style.display = 'none';
        this.progressDiv.style.display = 'block';
        this.progressFill.style.width = '0%';

        // Create FormData
        const formData = new FormData();
        formData.append('cape_image', file);
        formData.append('format', 'decal');

        try {
            // Upload to our API endpoint
            const xhr = new XMLHttpRequest();

            // Track progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    this.progressFill.style.width = percentComplete + '%';
                }
            });

            // Handle response
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        this.showSuccess(response.asset_id, response.image_id);
                    } else {
                        this.showError(response.error || 'Upload failed');
                    }
                } else {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        this.showError(errorResponse.error || 'Upload failed');
                    } catch (e) {
                        this.showError(`Upload failed: ${xhr.status} ${xhr.statusText}`);
                    }
                }
            });

            xhr.addEventListener('error', () => {
                this.showError('Network error. Please try again.');
            });

            // Send request
            xhr.open('POST', '/api/upload-cape');
            xhr.send(formData);

        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Failed to upload: ' + error.message);
        }
    }

    showSuccess(assetId, imageId) {
        this.progressDiv.style.display = 'none';
        this.resultDiv.style.display = 'block';

        document.getElementById('asset-id').textContent = assetId || 'Processing...';
        document.getElementById('image-id').textContent = imageId || 'Processing...';

        // If image ID is still processing, poll for it
        if (!imageId || imageId === 'Processing...') {
            this.pollForImageId(assetId);
        }
    }

    async pollForImageId(assetId, maxAttempts = 30) {
        // Poll the API for image ID (check every 5 seconds, up to 30 attempts = 2.5 minutes)
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000));

            try {
                const response = await fetch(`/api/cape-status/${assetId}`);
                const data = await response.json();

                if (data.image_id && data.image_id !== assetId) {
                    document.getElementById('image-id').textContent = data.image_id;
                    return;
                }
            } catch (error) {
                console.error('Error polling for image ID:', error);
            }
        }

        // Timeout - show message
        document.getElementById('image-id').innerHTML = 'Still processing...<br><small>Check back in a few minutes</small>';
    }

    showError(message) {
        this.progressDiv.style.display = 'none';
        this.resultDiv.style.display = 'block';
        this.resultDiv.innerHTML = `
            <div class="result-error">
                <h3>❌ Upload Failed</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <span class="btn-glow"></span>
                    <span class="btn-text">Try Again</span>
                </button>
            </div>
        `;
    }

    copyToClipboard(text, label) {
        navigator.clipboard.writeText(text).then(() => {
            // Show success feedback
            const button = event.target.closest('button');
            const originalText = button.querySelector('.btn-text').textContent;
            button.querySelector('.btn-text').textContent = 'Copied!';
            button.style.background = 'linear-gradient(135deg, var(--teal), var(--gold))';
            
            setTimeout(() => {
                button.querySelector('.btn-text').textContent = originalText;
                button.style.background = '';
            }, 2000);
        }).catch(err => {
            alert(`Failed to copy ${label}. Text: ${text}`);
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.pixlrIntegration = new PixlrIntegration();
});

