package queue

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

type Service struct {
	client   *sqs.Client
	queueURL *string
}

func New(ctx context.Context, queueName string) (*Service, error) {
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

	queueURL, err := getOrCreateQueue(ctx, client, queueName)
	if err != nil {
		return nil, fmt.Errorf("failed to get or create queue: %w", err)
	}

	slog.Info("Queue service initialized", slog.String("queueUrl", *queueURL))

	return &Service{
		client:   client,
		queueURL: queueURL,
	}, nil
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

func (s *Service) SendMessage(ctx context.Context, body string) error {
	out, err := s.client.SendMessage(ctx, &sqs.SendMessageInput{
		QueueUrl:    s.queueURL,
		MessageBody: &body,
	})
	if err != nil {
		return fmt.Errorf("failed to send sqs message: %w", err)
	}

	slog.Info("Message sent to queue", slog.String("messageId", *out.MessageId))
	return nil
}
