.PHONY : test-linux test-osx download-linux download-osx test

test-osx: download-osx test

download-linux:
	@echo "downloading linux nsqd"
	curl -L https://github.com/bitly/nsq/releases/download/v0.2.27/nsq-0.2.27.linux-amd64.go1.2.tar.gz > nsq.tar.gz

download-osx:
	@echo "downloading osx nsqd"
	curl -L https://github.com/bitly/nsq/releases/download/v0.2.27/nsq-0.2.27.darwin-amd64.go1.1.2.tar.gz > nsq.tar.gz

test:
	./test.sh
