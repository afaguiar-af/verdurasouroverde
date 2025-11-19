# Build stage
FROM node:18 AS build

WORKDIR /app

# Copy package files
COPY frontend/package.json frontend/yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY frontend/ .

# Build application
RUN yarn build

# Production stage
FROM nginx:stable-alpine

# Copy nginx config
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
