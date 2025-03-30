# PowerShell deployment script for Hugging Face Spaces

# Check if the directory exists and create it if it doesn't
if (!(Test-Path -Path "deploy")) {
    New-Item -ItemType Directory -Path "deploy"
}

# Copy all necessary files to deploy directory
Copy-Item -Path "app.py" -Destination "deploy/"
Copy-Item -Path "requirements.txt" -Destination "deploy/"
Copy-Item -Path "Dockerfile" -Destination "deploy/"
Copy-Item -Path ".dockerignore" -Destination "deploy/"
Copy-Item -Path "README.md" -Destination "deploy/"

# Change to deploy directory
Set-Location -Path "deploy"

# Initialize git if not already initialized
if (!(Test-Path -Path ".git")) {
    git init
}

# Add Hugging Face remote if not already added
$remoteExists = git remote -v | Select-String -Pattern "huggingface"
if (!$remoteExists) {
    git remote add origin "https://huggingface.co/spaces/dolvido/smart-image-insights-api"
}

# Add and commit files
git add .
git commit -m "Update deployment files"

Write-Host "Ready to push to Hugging Face Spaces!"
Write-Host "Run 'git push -u origin main' when ready" 