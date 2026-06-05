const fs = require('fs');
const path = require('path');

const mediaDir = path.join(__dirname, 'public', 'media');
const outputFile = path.join(mediaDir, 'media.json');

try {
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  const files = fs.readdirSync(mediaDir);
  const mediaFiles = files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov'].includes(ext);
    })
    .map(file => {
      const ext = path.extname(file).toLowerCase();
      const isVideo = ['.mp4', '.webm', '.mov'].includes(ext);
      return {
        id: file,
        type: isVideo ? 'video' : 'photo',
        url: `/media/${encodeURIComponent(file)}`,
        alt: file
      };
    })
    .reverse();

  fs.writeFileSync(outputFile, JSON.stringify(mediaFiles, null, 2), 'utf-8');
  console.log(`[Media Generator] Successfully generated ${mediaFiles.length} media items in ${outputFile}`);
} catch (error) {
  console.error('[Media Generator] Error generating media.json:', error);
}
