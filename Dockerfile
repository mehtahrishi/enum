# 1. Base Image: Choose a Python version
FROM python:3.9-slim-bullseye
# Using a specific Debian version (bullseye) can sometimes help with dependency stability.
# You can use python:3.9-slim, python:3.10-slim, etc.

# 2. Set Environment Variables
ENV PYTHONDONTWRITEBYTECODE 1 # Prevents python from writing .pyc files to disc
ENV PYTHONUNBUFFERED 1       # Prevents python from buffering stdin/stdout

# 3. Set Working Directory
WORKDIR /app

# 4. Install System Dependencies for Playwright
# These are crucial for Playwright's browsers to run headlessly on Linux.
# This list is for Debian-based images (like the -slim-bullseye image) and Chromium.
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Dependencies for Chromium
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    libfontconfig1 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libcairo2 \
    libx11-xcb1 \
    libxss1 \
    # For fonts, often helpful
    fonts-liberation \
    # Clean up apt cache
    && rm -rf /var/lib/apt/lists/*

# 5. Copy requirements.txt and Install Python Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6. Install Playwright Browsers
# This command uses the Playwright installed via pip in the previous step.
# Using --with-deps helps install browser-specific system dependencies as well.
RUN playwright install --with-deps chromium
# If you need other browsers, add them:
# RUN playwright install --with-deps firefox webkit

# 7. Copy Application Code
COPY . .
# This copies everything from your project's current directory (where Dockerfile is)
# into the /app directory inside the image. Ensure your .dockerignore file
# is set up to exclude venv, .git, .env, etc.

# 8. Expose Port
# This informs Docker that the application inside the container will listen on this port.
# The actual mapping to the host machine's port is done during 'docker run'.
# Gunicorn typically binds to 8000 if $PORT is not set, or uses $PORT.
EXPOSE 8000
# If you hardcode a port in your CMD line (e.g., 5000), expose that.

# 9. Define the Command to Run the Application
# MODIFIED CMD TO USE SHELL FORM FOR $PORT EXPANSION
CMD gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 --worker-class gthread app:app
# Explanation of Gunicorn args:
#   --bind 0.0.0.0:$PORT : Listen on all interfaces, on the port specified by $PORT (or 8000 if not set)
#   --workers 2           : Number of worker processes. A common recommendation is (2 * number_of_cores) + 1. Start with 2-4.
#   --threads 4           : Number of threads per worker (if using a threaded worker class like gthread).
#   --worker-class gthread: Use threaded workers for I/O-bound tasks (like web requests).
#   app:app               : Your Flask application (app.py, Flask instance named app).

# Alternative CMD for Waitress (simpler, pure Python) using shell form:
# CMD waitress-serve --host=0.0.0.0 --port=$PORT app:app