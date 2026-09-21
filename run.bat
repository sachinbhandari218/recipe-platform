@echo off
javac Server.java
if %ERRORLEVEL% equ 0 (
    java Server
)
