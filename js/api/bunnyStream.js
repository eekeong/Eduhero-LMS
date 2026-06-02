const BunnyStreamAPI = {
    async getLibraries(accountKey) {
        try {
            const response = await fetch('https://api.bunny.net/videolibrary', {
                method: 'GET',
                headers: {
                    'AccessKey': accountKey,
                    'accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch libraries. Check your Account API Key.');
            return await response.json();
        } catch (error) {
            console.error('[BunnyStream] getLibraries error:', error);
            throw error;
        }
    },

    async createVideo(libraryId, libraryKey, title) {
        try {
            const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
                method: 'POST',
                headers: {
                    'AccessKey': libraryKey,
                    'accept': 'application/json',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({ title })
            });
            if (!response.ok) throw new Error('Failed to create video placeholder in BunnyStream.');
            return await response.json(); // returns { guid: "...", ... }
        } catch (error) {
            console.error('[BunnyStream] createVideo error:', error);
            throw error;
        }
    },

    uploadVideo(libraryId, libraryKey, videoId, file, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`);
            xhr.setRequestHeader('AccessKey', libraryKey);
            
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    onProgress(event.loaded / event.total);
                }
            });
            
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error('Upload failed with status ' + xhr.status));
                }
            };
            
            xhr.onerror = () => reject(new Error('Network error during upload'));
            xhr.send(file);
        });
    },

    async deleteVideo(libraryId, libraryKey, videoId) {
        try {
            const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
                method: 'DELETE',
                headers: {
                    'AccessKey': libraryKey,
                    'accept': 'application/json'
                }
            });
            if (!response.ok && response.status !== 404) throw new Error('Failed to delete video from BunnyStream.');
            return true;
        } catch (error) {
            console.error('[BunnyStream] deleteVideo error:', error);
            throw error;
        }
    },

    async updateVideo(libraryId, libraryKey, videoId, title) {
        try {
            const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
                method: 'POST',
                headers: {
                    'AccessKey': libraryKey,
                    'accept': 'application/json',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({ title })
            });
            if (!response.ok) throw new Error('Failed to update video in BunnyStream.');
            return await response.json();
        } catch (error) {
            console.error('[BunnyStream] updateVideo error:', error);
            throw error;
        }
    }
};
