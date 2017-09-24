#! /usr/bin/env node

const FS = require("fs"),
	HTTPS = require("https"),
	PATH = require("path");

const MIME_TYPES = require("mime-types");

const FILE_PATH = ((prospectivePath) => {
		return (
			(prospectivePath.length && FS.lstatSync(prospectivePath).isDirectory())
		)
			? prospectivePath
			: process.cwd();
	})(
		((process.argv.length >= 3 && typeof process.argv[2] === "string")
			? process.argv[2] : "")
	),
	DATA_PATH = "./data/",
	PORT = 443;

let privateKey = FS.readFileSync(PATH.join(DATA_PATH, "key.pem"), {
		encoding: "utf-8"
	}),
	certificate = FS.readFileSync(PATH.join(DATA_PATH, "cert.pem"), {
		encoding: "utf-8"
	}),
	credentials = {
		key: privateKey,
		cert: certificate
	},
	handler = (req, res) => {
		let urlPath = ((req.url.length < 1 || req.url === "/") ? "index.html" : req.url),
			filePath = PATH.join(FILE_PATH, urlPath);

		console.log(Date.now() + ": " + filePath);

		let fileType = MIME_TYPES.lookup(filePath),
			fileDescriptor = null,
			fileContents = null;

		try {
			fileDescriptor = FS.openSync(filePath, "r");
			fileContents = FS.readFileSync(fileDescriptor, {
				encoding: "utf-8"
			});
		} catch(e) {} finally {
			if (typeof fileDescriptor === "number") {
				FS.closeSync(fileDescriptor);
			}
		}

		if (typeof fileContents !== "string" || fileType.length < 1) {
			res.statusCode = 404;
			res.end("NOT FOUND");
			return;
		}

		if (typeof fileType === "string" && fileType.length) {
			res.setHeader("Content-Type", fileType);
		}

		res.end(fileContents);
	},
	server = HTTPS.createServer(credentials, handler);

server.listen(PORT, () => {
	console.log(`Server listening on port ${ PORT } [${ FILE_PATH }].`);
});
