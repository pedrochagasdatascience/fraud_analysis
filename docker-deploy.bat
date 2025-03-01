@echo off
echo Building Docker image for the Fraud Dashboard...
docker build -t fraud-dashboard .
echo.
echo Docker image built successfully!
echo.
echo Running the Docker container on port 80...
docker run -p 80:80 fraud-dashboard
echo.
pause 