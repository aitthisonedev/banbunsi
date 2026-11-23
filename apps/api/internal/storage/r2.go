// Package storage provides private object storage. Authorization stays in the API;
// no public bucket or permanent download URLs are required.
package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"
)

type Object struct {
	Body io.ReadCloser
	Size int64
}

type Store interface {
	Put(context.Context, string, io.ReadSeeker, int64, string) error
	Open(context.Context, string) (*Object, error)
	Delete(context.Context, string) error
}

type R2 struct {
	client *s3.Client
	bucket string
}

func NewR2(account, bucket, accessKey, secretKey string) (*R2, error) {
	if !regexp.MustCompile(`^[a-fA-F0-9]{32}$`).MatchString(account) || bucket == "" || accessKey == "" || secretKey == "" {
		return nil, fmt.Errorf("R2 requires a valid R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY")
	}
	client := s3.NewFromConfig(aws.Config{
		Region:                     "auto",
		Credentials:                credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
		HTTPClient:                 &http.Client{Timeout: 2 * time.Minute},
		RequestChecksumCalculation: aws.RequestChecksumCalculationWhenRequired,
		ResponseChecksumValidation: aws.ResponseChecksumValidationWhenRequired,
	}, func(o *s3.Options) {
		o.BaseEndpoint = aws.String("https://" + account + ".r2.cloudflarestorage.com")
		o.UsePathStyle = true
	})
	return &R2{client: client, bucket: bucket}, nil
}

// ValidateKey keeps object access within the application's four upload folders.
func ValidateKey(key string) error {
	if key == "" || strings.ContainsAny(key, "\\\x00") || path.Clean(key) != key || strings.HasPrefix(key, "/") {
		return fmt.Errorf("invalid storage key")
	}
	parts := strings.Split(key, "/")
	if len(parts) != 2 || strings.HasPrefix(parts[1], ".") {
		return fmt.Errorf("invalid storage key")
	}
	switch parts[0] {
	case "documents", "covers", "branding", "avatars":
		return nil
	}
	return fmt.Errorf("invalid storage folder")
}

func (r *R2) Put(ctx context.Context, key string, body io.ReadSeeker, size int64, contentType string) error {
	if err := ValidateKey(key); err != nil {
		return err
	}
	_, err := r.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: &r.bucket, Key: &key, Body: body,
		ContentLength: &size, ContentType: &contentType,
	})
	return err
}

func (r *R2) Open(ctx context.Context, key string) (*Object, error) {
	if err := ValidateKey(key); err != nil {
		return nil, err
	}
	result, err := r.client.GetObject(ctx, &s3.GetObjectInput{Bucket: &r.bucket, Key: &key})
	if err != nil {
		var apiErr smithy.APIError
		if errors.As(err, &apiErr) && apiErr.ErrorCode() == "NoSuchKey" {
			return nil, os.ErrNotExist
		}
		return nil, err
	}
	return &Object{Body: result.Body, Size: aws.ToInt64(result.ContentLength)}, nil
}

func (r *R2) Delete(ctx context.Context, key string) error {
	if err := ValidateKey(key); err != nil {
		return err
	}
	_, err := r.client.DeleteObject(ctx, &s3.DeleteObjectInput{Bucket: &r.bucket, Key: &key})
	return err
}
