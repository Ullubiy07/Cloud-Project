import { useRef, useState } from "react";
import { Box, HStack, useColorMode, VStack } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { SNIPPETS, DEFAULT_FILES } from "../constants";
import { apiRun, apiGetRun, apiExplain } from "../api/client";
import Selector from "./Selector";
import Output from "./Output";
import Input from "./Input";
import Files from './Files';
import Explain from "./Explain";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 60000;

const LANGUAGE_MAP = {
    cpp: "c++",
};

const CodeEditor = ({ user }) => {
    const editorRef = useRef();
    const [language, setLanguage] = useState("python");
    const { colorMode } = useColorMode();
    const [fontSize, setFontSize] = useState(14);
    const [activeFile, setActiveFile] = useState({ id: 1, name: DEFAULT_FILES["python"] });
    const [output, setOutput] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stdin, setStdin] = useState("");
    const [explanation, setExplanation] = useState("");
    const [explainLoading, setExplainLoading] = useState(false);
    const [explainOpen, setExplainOpen] = useState(false);

    const [fileContents, setFileContents] = useState({
        1: SNIPPETS["python"],
        2: "",
    });

    const [files, setFiles] = useState([
        { id: 1, name: DEFAULT_FILES["python"] },
    ]);

    const onFontSize = (delta) => {
        setFontSize(prev => Math.min(24, Math.max(10, prev + delta)));
    };

    const onMount = (editor) => {
        editorRef.current = editor;
        editor.focus();
    };

    const onSelect = (lang) => {
        setLanguage(lang);
        const newName = DEFAULT_FILES[lang];
        setActiveFile(prev => ({ ...prev, name: newName }));
        setFiles(prev => prev.map(f =>
            f.id === activeFile.id ? { ...f, name: newName } : f
        ));
        setFileContents(prev => ({
            ...prev,
            [activeFile.id]: SNIPPETS[lang] ?? "",
        }));
    };

    const onFileSelect = (file) => {
        if (editorRef.current) {
            setFileContents(prev => ({
                ...prev,
                [activeFile.id]: editorRef.current.getValue(),
            }));
        }
        setActiveFile(file);
    };

    const onCodeChange = (value) => {
        setFileContents(prev => ({
            ...prev,
            [activeFile.id]: value,
        }));
    };

    const pollResult = async (id) => {
        const start = Date.now();
        while (Date.now() - start < POLL_TIMEOUT_MS) {
            await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
            const res = await apiGetRun(id);
            const run = res.data;
            const isDone = run.status === "completed" || run.status === "failed"
                || run.exit_code !== null && run.exit_code !== undefined
                || run.flags?.timeout;
            if (isDone) {
                return {
                    stdout: run.stdout ?? "",
                    stderr: run.stderr ?? run.error_message ?? "",
                    metrics: run.metrics,
                };
            }
        }
        throw new Error("Execution timed out");
    };

    const onRun = async () => {
        if (!localStorage.getItem("token")) {
            setOutput({ stderr: "Please log in to run code." });
            return;
        }
        const currentCode = editorRef.current.getValue();
        const updatedContents = { ...fileContents, [activeFile.id]: currentCode };
        const allFiles = files.map(f => ({
            name: f.name,
            content: updatedContents[f.id] ?? "",
        }));

        setLoading(true);
        setOutput(null);

        const mappedLanguage = LANGUAGE_MAP[language] ?? language;

        try {
            const enqueued = await apiRun(mappedLanguage, activeFile.name, allFiles, stdin);
            const id = enqueued.data?.id;
            if (!id) throw new Error("No run ID returned");
            const result = await pollResult(id);
            setOutput(result);
        } catch (err) {
            setOutput({ stderr: err.message });
        } finally {
            setLoading(false);
        }
    };

    const onExplain = async () => {
        const code = editorRef.current.getValue();
        setExplanation("");
        setExplainOpen(true);
        setExplainLoading(true);
        try {
            const res = await apiExplain([{ name: activeFile.name, content: code }]);
            setExplanation(res.data?.explanation ?? "No explanation received.");
        } catch (err) {
            setExplanation("Failed to get explanation. Please try again.");
        } finally {
            setExplainLoading(false);
        }
    };

    return (
        <Box px={4}>
            <Selector
                language={language}
                onSelect={onSelect}
                fontSize={fontSize}
                onFontSize={onFontSize}
                onRun={onRun}
                loading={loading}
                onExplain={onExplain}
                user={user}
            />
            <HStack spacing={4} alignItems="flex-start">
                <Files
                    activeFile={activeFile}
                    onSelect={onFileSelect}
                    files={files}
                    onFileCreate={(newFile) => {
                        setFiles(prev => [...prev, newFile]);
                        setFileContents(prev => ({ ...prev, [newFile.id]: "" }));
                        onFileSelect(newFile);
                    }}
                    onFileDelete={(id) => {
                        setFiles(prev => prev.filter(f => f.id !== id));
                        setFileContents(prev => {
                            const updated = { ...prev };
                            delete updated[id];
                            return updated;
                        });
                        if (activeFile.id === id) {
                            const remaining = files.filter(f => f.id !== id);
                            if (remaining.length > 0) onFileSelect(remaining[0]);
                        }
                    }}
                    onFileRename={(id, newName) => {
                        setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
                    }}
                />

                <Box flex={1}>
                    <Editor
                        height="100vh"
                        theme={colorMode === "dark" ? "vs-dark" : "light"}
                        language={language}
                        value={fileContents[activeFile.id] ?? ""}
                        onMount={onMount}
                        onChange={onCodeChange}
                        options={{
                            minimap: { enabled: false },
                            fontSize: fontSize,
                            scrollBeyondLastLine: false,
                        }}
                    />
                </Box>

                <VStack w="50%" spacing={2} alignItems="stretch" height="75vh">
                    <Input stdin={stdin} onStdin={setStdin} />
                    <Output output={output} loading={loading} />
                </VStack>
            </HStack>

            <Explain
                isOpen={explainOpen}
                onClose={() => setExplainOpen(false)}
                explanation={explanation}
                loading={explainLoading}
            />
        </Box>
    );
};
export default CodeEditor;