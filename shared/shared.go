package shared

// IsDesktop decides whether to run in desktop mode
func IsDesktop() bool {
	return GetenvOrDefault("ZHQUIZ_DESKTOP", "1") != "0"
}
