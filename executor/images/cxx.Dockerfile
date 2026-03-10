FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    time \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

COPY requirements.txt /code
RUN pip --no-cache-dir install -r /code/requirements.txt

COPY app /code/

RUN useradd -m -u 1001 user \
    && mkdir /home/user/tests \
    && chmod 555 /home/user \
    && chmod 777 /home/user/tests

USER user

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--no-access-log"]

# for development
# docker build -t cxx -f images/cxx.Dockerfile .
# docker run --rm --name Executor -p 8080:8080 -v $(pwd)/app:/code --memory="512m" --memory-swap="512m" cxx