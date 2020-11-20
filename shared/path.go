package shared

import (
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

// Path calculable paths
type Path struct {
	Dir  string
	Root string
}

// Paths get paths
func Paths() Path {
	dir, _ := filepath.Abs(filepath.Dir(os.Args[0]))
	root := os.Getenv("ZHQUIZ_ROOT")
	if root == "" {
		env, _ := godotenv.Read(".env")
		env["ZHQUIZ_ROOT"] = dir
		godotenv.Write(env, ".env")
	}

	return Path{
		Dir:  dir,
		Root: root,
	}
}

// Dotenv get path to .env
func (p Path) Dotenv() string {
	return filepath.Join(p.Root, ".env")
}

// MediaPath get media to media, and generate if necessary
func (p Path) MediaPath() string {
	mediaPath := filepath.Join(p.Root, "_media")
	_, err := os.Stat(mediaPath)
	if os.IsNotExist(err) {
		if err := os.Mkdir(mediaPath, 0644); err != nil {
			log.Fatal(err)
		}
	}

	return mediaPath
}

// GetenvOrDefault write to .env if env not exists
func GetenvOrDefault(key string, value string) string {
	v := os.Getenv(key)
	if v == "" {
		v = value

		p := Paths()
		env, _ := godotenv.Read(p.Dotenv())
		env[key] = v
		godotenv.Write(env, p.Dotenv())
	}

	return v
}

// GetenvOrDefaultFn write to .env if env not exists, using function
func GetenvOrDefaultFn(key string, fn func() string) string {
	v := os.Getenv(key)
	if v == "" {
		v = fn()

		p := Paths()
		env, _ := godotenv.Read(p.Dotenv())
		env[key] = v
		godotenv.Write(env, p.Dotenv())
	}

	return v
}
