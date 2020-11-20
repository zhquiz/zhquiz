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

// OpenInWindowedChrome open in Chrome/Chromium windowed mode
// Also, Chrome/Chromium location can be located with
// LORCACHROME environmental variable
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

	w, err := lorca.New(url, "", width, height)
	if err != nil {
		log.Fatal(err)
	}

	defer w.Close()

	// This does nothing in macOS, BTW.
	w.SetBounds(lorca.Bounds{
		WindowState: lorca.WindowStateMaximized,
	})

	// <- w.Done()

	return w
}
