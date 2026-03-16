import { useRef, useState } from "react";
import { Box, HStack, useColorMode, VStack } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { SNIPPETS } from "../constants";
import { apiRun } from "../api/client";
import Selector from "./Selector";
import Output from "./Output";
import Input from "./Input";

const CodeEditor = () => {
    const editorRef = useRef();
    const [value, setValue] = useState("");
    const [language, setLanguage] = useState("python");
    const { colorMode } = useColorMode();
    const [fontSize, setFontSize] = useState(14);

    const [output, setOutput] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stdin, setStdin] = useState("");

    const onFontSize = (delta) => {
        setFontSize(prev => Math.min(24, Math.max(10, prev + delta)));
    };

    const onMount = (editor) => {
        editorRef.current = editor;
        editor.focus();
    };

    const onSelect = (language) => {
        setLanguage(language);
        setValue(SNIPPETS[language]);
    };

    const onRun = async () => {
        const code = editorRef.current.getValue();
        setLoading(true);
        setOutput(null);

        try {
            const result = await apiRun(
                language,
                "main.py",
                [{ name: "main.py", content: code }],
                stdin
            );
            setOutput(result);
        } catch (err) {
            setOutput({ stderr: err.message });
        } finally {
            setLoading(false);
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
            />
            <HStack spacing={4} alignItems="flex-start">

                <Box w="50%">
                    <Editor
                        height="100vh"
                        theme={colorMode === "dark" ? "vs-dark" : "light"}
                        language={language}
                        defaultValue={SNIPPETS[language]}
                        onMount={onMount}
                        value={value}
                        onChange={(value) => setValue(value)}
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
        </Box>
    );
};
export default CodeEditor;