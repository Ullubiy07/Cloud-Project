package queue

import (
	"context"
	"fmt"
	"log/slog"
	"sync"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

type Service struct {
	client *sqs.Client
	urls   map[string]*string
	mu     sync.RWMutex
}

func New(ctx context.Context) (*Service, error) {
	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL:           "https://message-queue.api.cloud.yandex.net",
			SigningRegion: "ru-central1",
		}, nil
	})

	cfg, err := config.LoadDefaultConfig(
		ctx,
		config.WithEndpointResolverWithOptions(customResolver),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	client := sqs.NewFromConfig(cfg)

	slog.Info("Queue service initialized")

	return &Service{
		client: client,
		urls:   make(map[string]*string),
	}, nil
}

func (s *Service) getURL(ctx context.Context, queueName string) (*string, error) {
	s.mu.RLock()
	url, ok := s.urls[queueName]
	s.mu.RUnlock()
	if ok {
		return url, nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if url, ok := s.urls[queueName]; ok {
		return url, nil
	}

	url, err := getOrCreateQueue(ctx, s.client, queueName)
	if err != nil {
		return nil, err
	}

	s.urls[queueName] = url
	return url, nil
}

func getOrCreateQueue(ctx context.Context, client *sqs.Client, queueName string) (*string, error) {
	res, err := client.GetQueueUrl(ctx, &sqs.GetQueueUrlInput{
		QueueName: &queueName,
	})
	if err == nil {
		return res.QueueUrl, nil
	}

	createRes, err := client.CreateQueue(ctx, &sqs.CreateQueueInput{
		QueueName: &queueName,
	})
	if err != nil {
		return nil, err
	}

	return createRes.QueueUrl, nil
}

func (s *Service) SendMessage(ctx context.Context, queueName, body string) error {
	url, err := s.getURL(ctx, queueName)
	if err != nil {
		return fmt.Errorf("failed to resolve queue url: %w", err)
	}

	out, err := s.client.SendMessage(ctx, &sqs.SendMessageInput{
		QueueUrl:    url,
		MessageBody: &body,
	})
	if err != nil {
		return fmt.Errorf("failed to send sqs message: %w", err)
	}

	slog.Info("Message sent to queue", slog.String("queue", queueName), slog.String("messageId", *out.MessageId))
	return nil
}
