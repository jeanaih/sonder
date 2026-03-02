@echo off
REM Push script for Sonder repository
REM Repository: github.com/jeanaih/sonder

echo Starting push to github.com/jeanaih/sonder...

REM Configure git identity
echo Configuring git identity...
git config user.email "jeanaih016@gmail.com"
git config user.name "jeanaih"

REM Check if git is initialized
if not exist ".git" (
    echo Initializing git repository...
    git init
    git remote add origin https://github.com/jeanaih/sonder.git
)

REM Check and set correct remote
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Setting remote URL...
    git remote add origin https://github.com/jeanaih/sonder.git
) else (
    git remote set-url origin https://github.com/jeanaih/sonder.git
)

REM Add all files
echo Adding files...
git add .

REM Commit with timestamp
echo Creating commit...
git commit -m "Update: %date% %time%"

REM Ensure we're on main branch
echo Switching to main branch...
git branch -M main

REM Push to main branch
echo Pushing to remote repository...
git push -u origin main

if errorlevel 1 (
    echo Push failed! Check your credentials and network connection.
) else (
    echo Push completed successfully!
)
pause
