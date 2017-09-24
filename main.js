#! /usr/bin/env node

const FS = require("fs"),
	HTTPS = require("https"),
	PATH = require("path");

const MIME_TYPES = require("mime-types");

const FILE_PATH = ((prospectivePath) => {
		return ((prospectivePath.length && FS.lstatSync(prospectivePath).isDirectory())
			? prospectivePath : process.cwd());
	})(
		((process.argv.length >= 3 && typeof process.argv[2] === "string")
			? process.argv[2] : "")
	),
	DATA_PATH = PATH.join(__dirname, "data/"),
	ERROR_404_TEXT = "NOT FOUND",
	READ_FILE_ENCODING = "utf-8",
	READ_FILE_OPTIONS = { encoding: READ_FILE_ENCODING },
	EM_DASH = "—",
	PORT = 443;

let privateKey = FS.readFileSync(PATH.join(DATA_PATH, "key.pem"), READ_FILE_OPTIONS),
	certificate = FS.readFileSync(PATH.join(DATA_PATH, "cert.pem"), READ_FILE_OPTIONS),
	credentials = {
		key: privateKey,
		cert: certificate
	},
	handler = (req, res) => {
		let logDate = new Date(),
			logTime = (() => {
				let match = logDate.toUTCString().match(/\d{2}\:\d{2}\:\d{2}/);

				if (match == null || match.length < 1) {
					return "?";
				}

				let millis = logDate.getMilliseconds().toString(10);

				while (millis.length < 3) {
					millis += "0";
				}

				return match[0] + "." + millis;
			})(),
			urlPath = ((req.url.length < 1 || req.url === "/") ? "index.html" : req.url),
			filePath = PATH.join(FILE_PATH, urlPath),
			fileType = MIME_TYPES.lookup(filePath),
			fileDescriptor = null,
			fileContents = null,
			logText = [logTime, EM_DASH, filePath].join(" ");

		try {
			fileDescriptor = FS.openSync(filePath, "r");
			fileContents = FS.readFileSync(fileDescriptor, READ_FILE_OPTIONS);
		} catch(e) {} finally {
			if (fileDescriptor != null) {
				FS.closeSync(fileDescriptor);
			}
		}

		if (typeof fileContents !== "string" || fileType.length < 1) {
			res.statusCode = 404;
			res.end(ERROR_404_TEXT);
			logText += ["", EM_DASH, ERROR_404_TEXT].join(" ");
		} else {
			if (typeof fileType === "string" && fileType.length) {
				if (fileType.indexOf("text") === 0 || fileType.indexOf("application") === 0) {
					fileType += "; charset=" + READ_FILE_ENCODING;
				}

				res.setHeader("Content-Type", fileType);
			}

			res.end(fileContents);
		}

		console.log(logText);
	},
	server = HTTPS.createServer(credentials, handler);

server.listen(PORT, () => {
	console.log(`Server listening on port ${ PORT }.`);
});
