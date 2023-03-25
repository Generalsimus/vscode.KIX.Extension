import { CustomLanguageServiceHost } from '..';
import ts from '../../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';


export const getTsConfigOptions = (host: CustomLanguageServiceHost) => {
	const currentDirectory = host.getCurrentDirectory();
// ts.TypeScriptServicesFactory
	const tsConfigPath = ts.findConfigFile(
		currentDirectory,
		host.fileExists
	);
	const configFile = ts.readConfigFile(tsConfigPath, host.readFile);

	return ts.parseJsonConfigFileContent(
		configFile.config,
		ts.sys,
		host.getCurrentDirectory()
	);
};


// const configFile = ts.readConfigFile(this.tsConfigPath, ts.sys.readFile);
// import ts from "typescript";
// import { CustomCompilerHost } from "./";
// import path from "path";
// import { normalizePath } from "./utils/normalizePath";

// export function getTsConfigFilePath(this: CustomCompilerHost) {
//     const currentDirectory = this.getCurrentDirectory();
//     let configFileName: string | undefined;
//     if (this.defaultTsConfigPath) {
//         configFileName = path.resolve(currentDirectory, this.defaultTsConfigPath);
//     } else {
//         configFileName = ts.findConfigFile(
//             currentDirectory,
//             (fileName: string) => this.fileExists(fileName)
//         );
//     }
//     return normalizePath(configFileName || "");
// }