# 1. Use an official, stable Python 3.11 version
FROM python:3.11-slim

# 2. Set the working directory
WORKDIR /app

# 3. Copy your project files into the container
COPY . .

# 4. Install dependencies
# (We check if requirements.txt exists to avoid errors)
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

# 5. Open the port Railway expects
ENV PORT=8080
EXPOSE 8080

# 6. Run the application
# We use 'python app.py' to keep it simple.
CMD ["python", "app.py"]