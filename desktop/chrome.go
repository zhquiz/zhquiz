package desktop

import (
	"fmt"
	"log"

	/*
		#cgo darwin LDFLAGS: -framework CoreGraphics

		#if defined(__APPLE__)
		#include <CoreGraphics/CGDisplayConfiguration.h>
		int display_width() {
		return CGDisplayPixelsWide(CGMainDisplayID());
		}
		int display_height() {
		return CGDisplayPixelsHigh(CGMainDisplayID());
		}
		#else
		int display_width() {
		return 0;
		}
		int display_height() {
		return 0;
		}
		#endif
	*/
	"C"

	"github.com/zserge/lorca"
)
import (
	"net/http"
	"time"
)

// OpenInWindowedChrome opens in Chrome/Chromium windowed mode.
//
// Chrome/Chromium location can be specified with `LORCACHROME` environmental variable.
//
// See https://github.com/zserge/lorca/blob/master/locate.go
func OpenInWindowedChrome(url string) lorca.UI {
	if lorca.LocateChrome() == "" {
		lorca.PromptDownload()
		log.Fatal(fmt.Errorf("cannot open outside Chrome desktop application"))
	}

	width := int(C.display_width())
	height := int(C.display_height())

	if width == 0 || height == 0 {
		width = 1024
		height = 768
	}

	w, err := lorca.New("data:text/html,<title>Loading...</title>", "", width, height)
	if err != nil {
		log.Fatal(err)
	}

	// This does nothing in macOS.
	w.SetBounds(lorca.Bounds{
		WindowState: lorca.WindowStateMaximized,
	})

	go func() {
		for {
			time.Sleep(1 * time.Second)
			_, err := http.Head(url)
			if err == nil {
				break
			}
		}

		w.Load(url)
	}()

	return w
}
