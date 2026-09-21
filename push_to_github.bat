@echo off
set /p REPO_URL="Enter your GitHub Repository URL: "
C:\Users\lenovo\mingit\cmd\git.exe remote remove origin 2>nul
C:\Users\lenovo\mingit\cmd\git.exe remote add origin %REPO_URL%
C:\Users\lenovo\mingit\cmd\git.exe branch -M main
C:\Users\lenovo\mingit\cmd\git.exe push -u origin main
echo Repository uploaded successfully.
pause
