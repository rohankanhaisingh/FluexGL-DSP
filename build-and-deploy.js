const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const args = process.argv;

const acceptedArgumentFlags = [
    "--major",
    "--patch",
    "--minor"
];

const rootDirectory = path.join(__dirname, "./"),
    packageJsonFile = path.join(rootDirectory, "package.json");

if(!fs.existsSync(packageJsonFile))
    throw new Error("Could not build and deploy project because package.json does not exist.");

const fileContent = fs.readFileSync(packageJsonFile, "utf-8"),
    parsedContent = JSON.parse(fileContent);

const projectVersion = parsedContent["version"];

if(!projectVersion) 
    throw new Error("Could not build and deploy project, because property 'version' does not exist in package.json.");

const deconstructedProjectVersion = {
    major: Number(projectVersion.split(".")[0]),
    minor: Number(projectVersion.split(".")[1]),
    patch: Number(projectVersion.split(".")[2])
}

if(args.includes("--major")) {
    deconstructedProjectVersion.major += 1;
} else if(args.includes("--minor")) {
    deconstructedProjectVersion.minor += 1;
} else if(args.includes("--patch")) {
    deconstructedProjectVersion.patch += 1;
}

const reconstructedProjectVersion = `${deconstructedProjectVersion.major}.${deconstructedProjectVersion.minor}.${deconstructedProjectVersion.patch}`;

parsedContent["version"] = reconstructedProjectVersion;
fs.writeFileSync(packageJsonFile, JSON.stringify(parsedContent, null, 4), "utf-8");