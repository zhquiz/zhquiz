package shared

import (
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

// Path calculable paths
type Path struct {
	Root string
}

// Paths get paths
func Paths() Path {
	root := os.Getenv("ZHQUIZ_ROOT")
	if root == "" {
		if cwd, err := os.Getwd(); err == nil {
			root = cwd

			godotenv.Write(map[string]string{
				"ZHQUIZ_ROOT": root,
			}, ".env")
		}
	}

	return Path{
		Root: root,
	}
}

// Dotenv get path to .env
func (p Path) Dotenv() string {
	return filepath.Join(p.Root, ".env")
}

// GetenvOrDefault write to .env if env not exists
func GetenvOrDefault(key string, value string) string {
	v := os.Getenv(key)
	if v == "" {
		v = value

		p := Paths()

		godotenv.Write(map[string]string{
			key: v,
		}, p.Dotenv())
	}

	return v
}

// GetenvOrDefaultFn write to .env if env not exists, using function
func GetenvOrDefaultFn(key string, fn func() string) string {
	v := os.Getenv(key)
	if v == "" {
		v = fn()

		p := Paths()

		godotenv.Write(map[string]string{
			key: v,
		}, p.Dotenv())
	}

	return v
}
