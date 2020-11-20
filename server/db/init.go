package db

import (
	"log"
	"path/filepath"
	"strings"

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
	databaseURL := shared.GetenvOrDefaultFn("DATABASE_URL", func() string {
		paths := []string{"data.db"}
		if root := shared.Paths().Root; root != "" {
			paths = append([]string{root}, paths...)
		}

		return filepath.Join(paths...)
	})

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
