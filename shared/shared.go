package shared

// IsDesktop check whether is running in desktop mode
func IsDesktop() bool {
	return GetenvOrDefault("ZHQUIZ_DESKTOP", "1") != "0"
}
