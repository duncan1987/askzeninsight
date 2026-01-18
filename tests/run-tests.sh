#!/usr/bin/env bash

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Run tests
node node_modules/jest/bin/jest.js "$@"
