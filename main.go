package main

import (
	"path/filepath"

	"github.com/joho/godotenv"
	"github.com/patarapolw/zhquiz/server"
	"github.com/patarapolw/zhquiz/shared"
)

func main() {
	godotenv.Load(filepath.Join(shared.Root(), ".env"))
	server.Serve()
}
