# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o backend-service cmd/backend/main.go

# Run stage
FROM alpine:latest

WORKDIR /root/

RUN apk --no-cache add ca-certificates

COPY --from=builder /app/backend-service .
COPY --from=builder /app/migrations ./migrations

EXPOSE 3001

CMD ["./backend-service"]
