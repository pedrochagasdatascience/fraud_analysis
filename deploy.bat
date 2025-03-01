@echo off
echo Building the application for production...
call npm run build
echo.
echo Production build completed successfully!
echo The build files are located in the 'build' directory.
echo.
echo Deployment options:
echo 1. Copy the 'build' folder contents to your web server
echo 2. Deploy to Netlify: Run 'npx netlify deploy'
echo 3. Deploy to Vercel: Run 'npx vercel'
echo 4. Create a Docker image using the Dockerfile in the README
echo.
pause 