# Fraud Risk Dashboard

An interactive dashboard for configuring and visualizing fraud risk rules. The dashboard allows users to set rule parameters based on transaction scores and amounts, and visualize the impact of these rules on fraud prevention.

## Features

- Interactive sliders for configuring fraud rule thresholds
- Real-time metrics showing blocked transactions and caught fraud percentages
- Heatmap visualization of fraud patterns
- Detailed view of blocked transaction groups
- AND/OR logic support for rule conditions

## Prerequisites

Before you begin, ensure you have installed:
- [Node.js](https://nodejs.org/) (v14.x or later)
- npm (comes with Node.js)

## Installation

1. Clone this repository or download the source code
2. Navigate to the project directory
3. Install the dependencies:

```bash
npm install
```

## Running the Application Locally

To start the development server:

```bash
npm start
```

This will launch the application in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Building for Production

To create a production build:

```bash
npm run build
```

This command builds the app for production to the `build` folder. It bundles React in production mode and optimizes the build for best performance.

## Deployment Options

### Option 1: Static Hosting (Netlify, Vercel, GitHub Pages)

1. Build the project with `npm run build`
2. Deploy the contents of the `build` folder to your preferred static hosting provider.

#### Netlify Deployment
```bash
npm install -g netlify-cli
netlify deploy
```

#### Vercel Deployment
```bash
npm install -g vercel
vercel
```

### Option 2: Traditional Web Server

1. Build the project with `npm run build`
2. Copy the contents of the `build` folder to your web server's public directory
3. Configure your web server to serve the `index.html` file for any routes

### Option 3: Docker Deployment

1. Create a Dockerfile in the project root:

```dockerfile
FROM node:14-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Build and run the Docker image:

```bash
docker build -t fraud-dashboard .
docker run -p 80:80 fraud-dashboard
```

## Data Source

The application reads data from a CSV file located in the public directory. The CSV should contain aggregated transaction data including fraud metrics. 