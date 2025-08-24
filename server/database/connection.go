package database

import (
	"audiblytics/models"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	var err error
	DB, err = gorm.Open(sqlite.Open("audiblytics.db"), &gorm.Config{})

	if err != nil {
		log.Fatal("failed to connect to database: %v", err)
	}

	err = DB.AutoMigrate(
		&models.Word{},
		// &models.Paragraph{},
	)
	if err != nil {
		log.Fatal("failed to migrate database: %v", err)
	}
	log.Println("Database connection established and migrations completed.")

}
