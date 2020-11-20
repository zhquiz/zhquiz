package shared

import (
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

// Root get storage path
func Root() string {
	return os.Getenv("ZHQUIZ_ROOT")
}

// Port get server port
func Port() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	godotenv.Write(map[string]string{
		"PORT": port,
	}, filepath.Join(Root(), ".env"))

	return port
}
