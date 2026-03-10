FROM python:3.12-slim

WORKDIR /code

COPY requirements.txt /code
RUN pip --no-cache-dir install -r /code/requirements.txt

RUN apt-get update && apt-get install -y \
    time \
    golang \
    && rm -rf /var/lib/apt/lists/*

COPY app .

RUN useradd -m -u 1001 user \
    && mkdir -p /home/user/tests \
    && chmod -R 700 .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--no-access-log"]

# for development
# docker build -t go -f images/go.Dockerfile .
# docker run --rm --name Executor -p 8080:8080 -v $(pwd)/app:/code --memory="512m" go