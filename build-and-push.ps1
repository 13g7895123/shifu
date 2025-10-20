# Build and Push Docker Images Script
# Container Registry: your.cr:32000

param(
    [string]$Tag = "latest",
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$All
)

# Function definitions must come first
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Build-And-Push-Image {
    param(
        [string]$ImageName,
        [string]$DockerfilePath,
        [string]$BuildContext = "."
    )
    
    $FullImageName = "$CR/$PROJECT_NAME-$ImageName"
    $TaggedImageName = "$FullImageName`:$Tag"
    
    Write-Info "Building image: $TaggedImageName"
    Write-Info "Dockerfile path: $DockerfilePath"
    Write-Info "Build context: $BuildContext"
    
    # Build image
    docker build -f $DockerfilePath -t $TaggedImageName $BuildContext
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build image: $TaggedImageName"
        return $false
    }
    
    Write-Info "Image built successfully: $TaggedImageName"
    
    # Push image
    Write-Info "Pushing image to registry: $TaggedImageName"
    docker push $TaggedImageName
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to push image: $TaggedImageName"
        return $false
    }
    
    Write-Info "Image pushed successfully: $TaggedImageName"
    
    # Also tag as latest if not already latest
    if ($Tag -ne "latest") {
        $LatestImageName = "$FullImageName`:latest"
        docker tag $TaggedImageName $LatestImageName
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Pushing latest tag: $LatestImageName"
            docker push $LatestImageName
            if ($LASTEXITCODE -eq 0) {
                Write-Info "Latest tag pushed successfully"
            } else {
                Write-Error "Failed to push latest tag"
            }
        }
    }
    
    return $true
}

# Script variables and initialization
$CR = "your.cr:32000"
$PROJECT_NAME = "luckygo"

Write-Info "Script started with parameters:"
Write-Info "  Tag: $Tag"
Write-Info "  Backend: $Backend"
Write-Info "  Frontend: $Frontend"
Write-Info "  All: $All"

# Check if Docker is running
Write-Info "Checking Docker status..."
docker version > $null 2>&1
$dockerExitCode = $LASTEXITCODE
Write-Info "Docker version check exit code: $dockerExitCode"
if ($dockerExitCode -ne 0) {
    Write-Error "Docker is not running or not installed. Please ensure Docker is running."
    exit 1
}
Write-Info "Docker is running successfully."

Write-Info "Starting Docker image build and push process..."
Write-Info "Container Registry: $CR"
Write-Info "Tag: $Tag"

$success = $true

# Determine which images to build based on parameters
if ($All -or (!$Backend -and !$Frontend)) {
    # Build all images
    Write-Info "Building all images..."
    
    # Build backend image
    if (!(Build-And-Push-Image -ImageName "backend" -DockerfilePath "Dockerfile")) {
        $success = $false
    }
    
    # Build frontend image
    if (!(Build-And-Push-Image -ImageName "frontend" -DockerfilePath "frontend/Dockerfile" -BuildContext "frontend")) {
        $success = $false
    }
} else {
    # Build specific images based on parameters
    if ($Backend) {
        Write-Info "Building backend image..."
        if (!(Build-And-Push-Image -ImageName "backend" -DockerfilePath "Dockerfile")) {
            $success = $false
        }
    }
    
    if ($Frontend) {
        Write-Info "Building frontend image..."
        if (!(Build-And-Push-Image -ImageName "frontend" -DockerfilePath "frontend/Dockerfile" -BuildContext "frontend")) {
            $success = $false
        }
    }
}

if ($success) {
    Write-Info "All images built and pushed successfully!"
    Write-Info "Images pushed to: $CR/$PROJECT_NAME-*:$Tag"
} else {
    Write-Error "Some images failed to build or push. Please check the error messages above."
    exit 1
}

Write-Info "Script execution completed."
