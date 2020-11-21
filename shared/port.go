package shared

// Port gets server port, or "default" port value
func Port() string {
	return GetenvOrDefault("PORT", "35594")
}
