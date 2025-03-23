import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import https from 'https';
import { createWriteStream } from 'fs';
import { exec } from 'child_process';

const execAsync = promisify(exec);
const chmod = promisify(fs.chmod);
const mkdir = promisify(fs.mkdir);

// Use pre-built Chrome binaries from S3 as a fallback
// This is a common strategy for running Chrome in Lambda
const CHROME_S3_URL = 'https://github.com/alixaxel/chrome-aws-lambda/releases/download/v10.1.0/chromium-v10.1.0-linux-x64.tar.gz';

/**
 * Downloads a file from URL to a local path
 * @param {string} url URL to download from
 * @param {string} destPath Path to save file to
 * @returns {Promise<string>} Path to downloaded file
 */
async function downloadFile(url, destPath) {
  console.log(`Downloading from ${url} to ${destPath}...`);
  
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath);
    
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download, status code: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Download completed: ${destPath}`);
        resolve(destPath);
      });
    }).on('error', err => {
      fs.unlink(destPath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

/**
 * Extracts a tar.gz file
 * @param {string} tarPath Path to tar.gz file
 * @param {string} extractPath Path to extract to
 * @returns {Promise<string>} Path to extraction directory
 */
async function extractTarball(tarPath, extractPath) {
  console.log(`Extracting ${tarPath} to ${extractPath}...`);
  
  try {
    await mkdir(extractPath, { recursive: true });
    await execAsync(`tar -xzf ${tarPath} -C ${extractPath}`);
    console.log(`Extraction completed to ${extractPath}`);
    return extractPath;
  } catch (error) {
    console.error('Error extracting tarball:', error);
    throw error;
  }
}

/**
 * Downloads Chrome from S3 and installs it to the specified directory
 * @param {string} installDir Directory to install Chrome to
 * @returns {Promise<string>} Path to Chrome executable
 */
export async function downloadChromeFromS3(installDir = '/tmp/chromium') {
  try {
    console.log('Starting Chrome download from S3...');
    
    // Create the installation directory if it doesn't exist
    await mkdir(installDir, { recursive: true });
    
    // Setup paths
    const tarballPath = path.join('/tmp', 'chrome.tar.gz');
    const chromePath = path.join(installDir, 'chrome');
    
    // Skip download if Chrome already exists
    if (fs.existsSync(chromePath)) {
      console.log(`Chrome already exists at ${chromePath}, skipping download`);
      return chromePath;
    }
    
    // Download and extract Chrome
    await downloadFile(CHROME_S3_URL, tarballPath);
    await extractTarball(tarballPath, installDir);
    
    // Make Chrome executable
    await chmod(chromePath, 0o755);
    console.log(`Made Chrome executable at ${chromePath}`);
    
    // Cleanup tarball
    try {
      fs.unlinkSync(tarballPath);
      console.log('Cleaned up tarball');
    } catch (err) {
      console.warn('Failed to cleanup tarball:', err.message);
    }
    
    return chromePath;
  } catch (error) {
    console.error('Failed to download Chrome from S3:', error);
    return null;
  }
}

/**
 * Checks whether Chrome is installed and accessible
 * @param {string} chromePath Path to Chrome executable
 * @returns {Promise<boolean>} Whether Chrome is accessible
 */
export async function isChromiumAccessible(chromePath) {
  try {
    if (!fs.existsSync(chromePath)) {
      return false;
    }
    
    // Try to get Chrome version as a quick test
    const { stdout } = await execAsync(`${chromePath} --version`);
    console.log('Chrome version:', stdout.trim());
    return true;
  } catch (error) {
    console.error('Chrome is not accessible:', error.message);
    return false;
  }
} 