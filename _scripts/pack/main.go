package main

import (
	"archive/zip"
	"io"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var reExe *regexp.Regexp = regexp.MustCompile("\\.exe$")
var reZipped []string = []string{"assets", "docs", "public"}

func main() {
	os.Mkdir("dist", 0755)

	var exePaths []string
	var toBeZipped []string

	filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if strings.HasPrefix(path, "zhquiz-") && !strings.ContainsRune(path, filepath.Separator) {
			exePaths = append(exePaths, path)

			return nil
		}

		rootFolder := filepath.SplitList(path)[0]

		for _, a := range reZipped {
			if a == rootFolder {
				toBeZipped = append(toBeZipped, a)
			}
		}

		return nil
	})

	for _, exe := range exePaths {
		// Cannot use go func for some reasons
		createZip(exe)
	}
}

func createZip(exe string) {
	archivePath := filepath.Join("dist", reExe.ReplaceAllString(exe, "")+".zip")
	log.Printf("Creating: " + archivePath)

	var zipFile *os.File

	if a, err := os.Create(archivePath); err == nil {
		zipFile = a
	} else {
		a, err := os.Open(archivePath)

		if err != nil {
			log.Fatal(err)
		}
		zipFile = a
	}

	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	if err := addFileToZip(zipWriter, exe); err != nil {
		log.Fatal(err)
	}

	for _, p := range reZipped {
		err := filepath.Walk(p, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			if info.IsDir() {
				return nil
			}

			if err := addFileToZip(zipWriter, path); err != nil {
				return err
			}

			return nil
		})

		if err != nil {
			log.Fatal(err)
		}
	}
}

func addFileToZip(zipWriter *zip.Writer, filename string) error {
	fileToZip, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer fileToZip.Close()

	// Get the file information
	info, err := fileToZip.Stat()
	if err != nil {
		return err
	}

	header, err := zip.FileInfoHeader(info)
	if err != nil {
		return err
	}

	// Using FileInfoHeader() above only uses the basename of the file. If we want
	// to preserve the folder structure we can overwrite this with the full path.
	header.Name = filename

	// Change to deflate to gain better compression
	// see http://golang.org/pkg/archive/zip/#pkg-constants
	header.Method = zip.Deflate

	writer, err := zipWriter.CreateHeader(header)
	if err != nil {
		return err
	}
	_, err = io.Copy(writer, fileToZip)
	return err
}
