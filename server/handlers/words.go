package handlers

import (
	"audiblytics/database"
	"audiblytics/models"
	"audiblytics/services"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

type AddWordRequest struct {
	Word          string   `json:"word"`
	Meanings      []string `json:"meanings"`
	Pronunciation string   `json:"pronunciation"`
}

type GetSentenceResponse struct {
	WordID    uint     `json:"wordid"`
	Sentences []string `json:"sentences"`
}
type GetActiveWordResponse struct {
	Word      []models.Word `json:"word"`
	Sentances []string      `json:"sentences"`
}

func AddWordHandler(c echo.Context) error {
	var req AddWordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	word := models.Word{
		Word:          req.Word,
		Meanings:      req.Meanings,
		Pronunciation: req.Pronunciation,
		CreatedAt:     time.Now(),
		IsActive:      true,
	}

	if err := database.DB.Create(&word).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to add word"})
	}

	return c.JSON(http.StatusCreated, word)
}

func getWord(c echo.Context) error {

	var wordModel models.Word
	word := c.Param("word")

	if err := database.DB.Where("word = ?", word).First(&wordModel).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Word not found"})
	}

	return c.JSON(http.StatusOK, wordModel)
}

func GetWords() ([]models.Word, error) {
	var words []models.Word
	if err := database.DB.Where("is_active = ?", true).Find(&words).Error; err != nil {
		log.Println("Failed to retrieve words:", err)
		return nil, err
	}
	return words, nil
}
func GetWordsHandler(c echo.Context) error {
	words, err := GetWords()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve words"})
	}
	return c.JSON(http.StatusOK, words)
}

func RemoveWord(c echo.Context) error {
	wordID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid word ID"})
	}
	var word models.Word

	if err := database.DB.First(&word, wordID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Word not found"})
	}
	word.IsActive = false
	if err := database.DB.Save(&word).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to remove word"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Word removed successfully"})
}

func GetActiveWords(c echo.Context) error {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "OpenAI API key not configured"})
	}
	words, _ := GetWords()

	aiService := services.NewAIService(apiKey)
	prompt := GenerateSentencePromptForWords(words)
	resp, err := aiService.GenerateOpenAIResponse(prompt)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to generate paragraph"})
	}

	var sentences []GetSentenceResponse
	err = json.Unmarshal([]byte(resp), &sentences)

	activeWords := []GetActiveWordResponse{}

	sentenceMap := make(map[uint][]string)
	for _, sen := range sentences {
		sentenceMap[sen.WordID] = sen.Sentences
	}

	for _, word := range words {
		if sents, ok := sentenceMap[word.ID]; ok {
			activeWords = append(activeWords, GetActiveWordResponse{
				Word:      []models.Word{word},
				Sentances: sents,
			})
		}
	}

	return c.JSON(http.StatusOK, activeWords)
}
func GenerateSentencePromptForWords(words []models.Word) string {
	var sb strings.Builder

	sb.WriteString(`
	For the given words, generate example sentences that cover **all their meanings** in natural and conversational language.

	Guidelines:
	1. For each meaning of each word, generate **one sentence**.
	2. The sentences should be simple, clear, and easy to understand.
	3. Do not define the word explicitly; use it naturally in the context of the sentence.
	4. Do not number the sentences or mention the meanings again.
	5. Try to generate new sentences every time you call this prompt.

	Output JSON in this format:
	[
	{
		"word": "<the wordID>",
		"sentences": [
		"<sentence for meaning 1>",
		"<sentence for meaning 2>",
		...
		]
	},
	...
	]

	Output only JSON. No explanations.

	WordIDs, Words and Meanings:
	`)

	for _, word := range words {
		sb.WriteString(fmt.Sprintf("WordID: %s\nWord: %s\nMeanings: %s\n\n", word.ID, word.Word, strings.Join(word.Meanings, ", ")))
	}

	return sb.String()
}
