helm.exe --kubeconfig .\kubeconfig.yaml -n luckygo upgrade luckygo .\helm\luckygo\

kubectl.exe --kubeconfig .\kubeconfig.yaml -n luckygo rollout restart deployment luckygo-frontend luckygo-backend
