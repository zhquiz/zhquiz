package db

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
	"github.com/patarapolw/zhquiz/shared"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// DB storage for current DB
type DB struct {
	Current *gorm.DB
}

// Connect connect to DATABASE_URL
func Connect() *gorm.DB {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		paths := []string{"data.db"}
		if root := os.Getenv("ZHQUIZ_ROOT"); root != "" {
			paths = append([]string{root}, paths...)
		}

		databaseURL = filepath.Join(paths...)

		godotenv.Write(map[string]string{
			"DATABASE_URL": databaseURL,
		}, filepath.Join(shared.Root(), ".env"))
	}

	if strings.HasPrefix(databaseURL, "postgres://") {
		db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
		if err != nil {
			log.Fatalln(err)
		}
		return db
	}

	db, err := gorm.Open(sqlite.Open(databaseURL), &gorm.Config{})
	if err != nil {
		log.Fatalln(err)
	}
	return db
}
