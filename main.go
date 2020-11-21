package main

import (
	"fmt"
	"os"
	"os/signal"

	"github.com/joho/godotenv"
	"github.com/patarapolw/zhquiz/desktop"
	"github.com/patarapolw/zhquiz/server"
	"github.com/patarapolw/zhquiz/server/api"
	"github.com/patarapolw/zhquiz/shared"
)

func main() {
	p := shared.Paths()
	godotenv.Load(p.Dotenv())

	res := api.Prepare()
	defer res.Cleanup()

	if shared.IsDesktop() {
		w := desktop.OpenInWindowedChrome(fmt.Sprintf("http://localhost:%s", shared.Port()))
		defer w.Close()

		server.Serve(&res)

		<-w.Done()
	} else {
		server.Serve(&res)

		c := make(chan os.Signal)
		signal.Notify(c, os.Interrupt)

		<-c
	}
}
