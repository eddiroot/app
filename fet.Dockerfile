FROM ubuntu:latest

# Install FET and dependencies
RUN apt update && \
    apt install -y fet && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

# Create working directory structure for timetable processing
WORKDIR /app
RUN mkdir -p /app/timetables

# Default command - keep container running
CMD ["tail", "-f", "/dev/null"]