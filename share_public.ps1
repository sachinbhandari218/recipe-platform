Start-Process -FilePath "java" -ArgumentList "Server" -WindowStyle Hidden
Start-Sleep -Seconds 2
while ($true) {
    & .\cloudflared.exe tunnel --url http://localhost:8080
    Start-Sleep -Seconds 5
}
