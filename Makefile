prepare:
	pnpm install --recursive
	cd client/android && ./gradlew clean
