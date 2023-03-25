
import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';




export class CustomLanguageServiceHost implements ts.LanguageServiceHost {
	currentDirectory:string
	constructor(currentDirectory:string){
		this.currentDirectory = currentDirectory;
	}
	fileCatches = new Map<string, {
		currentSourceFile: ts.SourceFile,
		versionSourceFile: ts.SourceFile[],
	}>();
	getCurrentDirectory() {
		return this.currentDirectory;
	}
	getDefaultLibFileName = ts.getDefaultLibFilePath
	fileExists = ts.sys.fileExists
	readFile = ts.sys.readFile
	readDirectory = ts.sys.readDirectory
	directoryExists = ts.sys.directoryExists
	getDirectories = ts.sys.getDirectories
	getCompilationSettings = ts.getDefaultCompilerOptions
	getScriptVersion(fileName: string) {
		return this.fileCatches.get(fileName)?.versionSourceFile.length + "";
	}
	getScriptFileNames() {
		return Array.from(this.fileCatches.keys());
	}
	getScriptSnapshot(fileName: string) {
		const sourceFile = this.fileCatches.get(fileName)?.currentSourceFile.getFullText();
		if (sourceFile === undefined) return undefined;

		return ts.ScriptSnapshot.fromString(sourceFile);
	}

}