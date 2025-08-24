package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

type AIService struct {
	APIKey  string
	BaseURL string
}

type OpenAIRequest struct {
	Model     string    `json:"model"`
	Messages  []Message `json:"messages"`
	MaxTokens int       `json:"max_tokens"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}
type OpenAIResponse struct {
	Choices []Choice `json:"choices"`
}
type Choice struct {
	Message Message `json:"message"`
}

func NewAIService(apiKey string) *AIService {
	return &AIService{
		APIKey:  apiKey,
		BaseURL: "https://api.openai.com/v1/chat/completions",
	}
}

func (s *AIService) GenerateOpenAIResponse(prompt string) (string, error) {
	reqBody := OpenAIRequest{
		Model: "gpt-3.5-turbo",
		Messages: []Message{
			{Role: "user", Content: prompt},
		},
		MaxTokens: 300,
	}

	jsonData, _ := json.Marshal(reqBody)

	req, err := http.NewRequest("POST", s.BaseURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.APIKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var openAIResp OpenAIResponse
	if err := json.Unmarshal(body, &openAIResp); err != nil {
		return "", err
	}

	if len(openAIResp.Choices) == 0 {
		return "", fmt.Errorf("no response from OpenAI")
	}

	return openAIResp.Choices[0].Message.Content, nil
}
