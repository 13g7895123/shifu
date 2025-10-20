# Helm deployment script with kubeconfig
# Usage: .\deploy-helm.ps1 [install|upgrade|uninstall]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("install", "upgrade", "uninstall", "status")]
    [string]$Action,
    
    [string]$ReleaseName = "luckygo",
    [string]$Namespace = "luckygo",
    [string]$ValuesFile = "values.yaml"
)

$KubeConfig = "..\..\kubeconfig.yaml"
$ChartPath = "."

# Check if kubeconfig exists
if (-not (Test-Path $KubeConfig)) {
    Write-Error "Kubeconfig file not found: $KubeConfig"
    exit 1
}

# Change to helm directory
Set-Location $PSScriptRoot

Write-Host "Using kubeconfig: $KubeConfig" -ForegroundColor Green
Write-Host "Action: $Action" -ForegroundColor Yellow
Write-Host "Release Name: $ReleaseName" -ForegroundColor Yellow
Write-Host "Namespace: $Namespace" -ForegroundColor Yellow

switch ($Action) {
    "install" {
        Write-Host "Installing Helm chart..." -ForegroundColor Green
        helm install $ReleaseName $ChartPath --kubeconfig $KubeConfig --namespace $Namespace --create-namespace --values $ValuesFile
    }
    "upgrade" {
        Write-Host "Upgrading Helm chart..." -ForegroundColor Green
        helm upgrade $ReleaseName $ChartPath --kubeconfig $KubeConfig --namespace $Namespace --values $ValuesFile
    }
    "uninstall" {
        Write-Host "Uninstalling Helm chart..." -ForegroundColor Red
        helm uninstall $ReleaseName --kubeconfig $KubeConfig --namespace $Namespace
    }
    "status" {
        Write-Host "Checking Helm release status..." -ForegroundColor Blue
        helm status $ReleaseName --kubeconfig $KubeConfig --namespace $Namespace
        Write-Host "`nPods status:" -ForegroundColor Blue
        kubectl get pods --kubeconfig $KubeConfig --namespace $Namespace
        Write-Host "`nServices status:" -ForegroundColor Blue
        kubectl get services --kubeconfig $KubeConfig --namespace $Namespace
        Write-Host "`nIngress status:" -ForegroundColor Blue
        kubectl get ingress --kubeconfig $KubeConfig --namespace $Namespace
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Operation completed successfully!" -ForegroundColor Green
    
    if ($Action -eq "install" -or $Action -eq "upgrade") {
        Write-Host "`nAccess URLs:" -ForegroundColor Cyan
        Write-Host "Frontend: https://your.domain/" -ForegroundColor White
        Write-Host "Backend API: https://your.domain/api" -ForegroundColor White
        Write-Host "Redis UI: https://your.domain/redis-ui" -ForegroundColor White
        Write-Host "`nRedis UI credentials:" -ForegroundColor Cyan
        Write-Host "Username: admin" -ForegroundColor White
        Write-Host "Password: luckygo-redis-ui-password" -ForegroundColor White
    }
} else {
    Write-Host "Operation failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}
