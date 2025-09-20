#!/bin/bash

echo "Installing dependencies..."
npm install

echo "Starting AI Backend Server..."
echo "Make sure to update the API_BASE_URL in example/app/api.ts with your machine's IP address"
echo ""

npm start
