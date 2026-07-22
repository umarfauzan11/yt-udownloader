const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Download endpoint
app.post('/api/download', (req, res) => {
  const { url, format } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const tempDir = os.tmpdir();
  const timestamp = Date.now();

  let ytArgs = [];
  let outputFile;

  if (format === 'mp3') {
    outputFile = path.join(tempDir, `yt-${timestamp}.mp3`);
    ytArgs = ['-x', '--audio-format', 'mp3', '-o', outputFile, url];
  } else {
    const qualityMap = {
      mp4_1080: 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/mp4',
      mp4_720:  'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/mp4',
      mp4_480:  'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/mp4',
      mp4_best: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4'
    };
    const quality = qualityMap[format] || qualityMap.mp4_best;
    outputFile = path.join(tempDir, `yt-${timestamp}.mp4`);
    ytArgs = ['-f', quality, '-o', outputFile, url];
  }

  const ytDlp = spawn('yt-dlp', ytArgs);

  ytDlp.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  ytDlp.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({
        error: 'Download failed. Please check the URL and try again.'
      });
    }

    fs.access(outputFile, fs.constants.R_OK, (err) => {
      if (err) {
        return res.status(500).json({
          error: 'File not found. Download may have failed.'
        });
      }

      res.download(outputFile, (err) => {
        if (err) console.error('Send file error:', err);
        fs.unlink(outputFile, () => {});
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
