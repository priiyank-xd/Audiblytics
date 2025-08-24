package models

import (
	"time"
)

type Word struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	Word          string    `json:"word" gorm:"uniqueIndex"`
	Meanings      []string  `json:"meanings" gorm:"type:text;not null"`
	Pronunciation string    `json:"pronunciation" gorm:"not null"`
	IsActive      bool      `json:"is_active" gorm:"default:false"`
	CreatedAt     time.Time `json:"created_at" gorm:"autoCreateTime"`
}

type Paragraph struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Content   string    `json:"content" gorm:"text"`
	Words     []Word    `json:"words" gorm:"many2many:paragraph_words;"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}
