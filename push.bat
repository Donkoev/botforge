@echo off
set /p msg="Commit message: "
if "%msg%"=="" set msg="Update"

echo Adding files...
git add .

echo Committing...
git commit -m "%msg%"

echo Pushing...
git push origin main

echo Done!
pause
