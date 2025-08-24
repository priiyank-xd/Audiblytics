package handlers

import (
	"audiblytics/models"
	"audiblytics/services"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

type GenerateParagraphRequest struct {
	Topic    string    `json:"topic"`
	ParaDate time.Time `json:"para_date"`
}

type GenerateParagraphResponse struct {
	Paragraph string        `json:"paragraph"`
	Words     []models.Word `json:"words"`
}

func GenerateParagraph(c echo.Context) error {
	var req GenerateParagraphRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "OpenAI API key not configured"})
	}

	words, _ := GetWords()
	wordsList := make([]string, len(words))
	for i, word := range words {
		wordsList[i] = word.Word
	}

	aiService := services.NewAIService(apiKey)
	prompt := GenerateParagraphPrompt(req.Topic, wordsList)
	resp, err := aiService.GenerateOpenAIResponse(prompt)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to generate paragraph"})
	}

	var para GenerateParagraphResponse
	err = json.Unmarshal([]byte(resp), &para)

	return c.JSON(http.StatusOK, para)
}

func GenerateParagraphPrompt(Topic string, words []string) string {
	wordsStr := strings.Join(words, ", ")
	return fmt.Sprintf(`Write a vivid and engaging paragraph (150-200 words) that naturally incorporates these vocabulary words: %s.
		Guidelines:
		1. Use any 2-3 words once (if there are any), and fit them naturally into the context.
		2. Make the paragraph educational, interesting, and conversational.
		3. Ensure smooth sentence flow without sounding forced or robotic.
		4. The paragraph must be suitable for both pronunciation and typing practice. Include a variety of sentence lengths and rhythms to improve user experience.

		Optional Topics: %s
		If the topics are provided, align the paragraph with it. 
		If not, use creative everyday scenarios like travel, introspection, or unusual events to make the writing vivid and memorable.

		At the end of your response, output JSON with the following structure:

		{
		"paragraph": "<the generated paragraph>",
		"words": [
			{
				"word": "<word>",
				"pronunciation": "<how to pronounce it in simple phonetics>",
				"meanings": ["<meaning 1>", "<meaning 2>"]
				},
				...
			]
		}
		Include only the tough or uncommon words (from the given list or naturally hard-to-pronounce words in the paragraph) in the JSON output.
		Output must be plain JSON without extra text or explanation.
		`, wordsStr, Topic)
}
