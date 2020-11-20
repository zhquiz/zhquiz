package main

import (
	"fmt"
	"os"
	"os/signal"

	"github.com/joho/godotenv"
	"github.com/patarapolw/zhquiz/desktop"
	"github.com/patarapolw/zhquiz/server"
	"github.com/patarapolw/zhquiz/shared"
)

func main() {
	p := shared.Paths()
	godotenv.Load(p.Dotenv())

	s := server.Prepare()

	if shared.IsDesktop() {
		w := desktop.OpenInWindowedChrome(fmt.Sprintf("http://localhost:%s", shared.Port()))

		go func() {
			s.Serve()
		}()

		<-w.Done()

		s.Cleanup()
	} else {
		c := make(chan os.Signal)
		signal.Notify(c, os.Interrupt)

		go func() {
			<-c
			s.Cleanup()
		}()

		s.Serve()
	}
}
