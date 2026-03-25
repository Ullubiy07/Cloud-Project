FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    nasm \
    gcc-multilib \
    time \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

COPY requirements.txt /code
RUN pip --no-cache-dir install -r /code/requirements.txt

COPY app /code
COPY rules /code/rules
COPY sgconfig.yml /code/sgconfig.yml
COPY include /include

RUN useradd -u 1001 user \
    && mkdir /tests \
    && chown user /tests

USER user

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

# for development
# docker build -t assembler -f images/asm.Dockerfile .
# docker run --rm --name Executor -p 8080:8080 --memory="512m" --memory-swap="512m" assembler