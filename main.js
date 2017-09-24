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
	DATA_PATH = "./data/",
	ERROR_404_TEXT = "NOT FOUND",
	EM_DASH = "—",
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
			res.end(ERROR_404_TEXT);
			logText += ["", EM_DASH, ERROR_404_TEXT].join(" ");
		} else {
			if (typeof fileType === "string" && fileType.length) {
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
