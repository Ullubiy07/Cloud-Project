import { useRef, useState } from "react";
import { Box, HStack, VStack } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { SNIPPETS } from "../constants";
import Selector from "./Selector";
import Output from "./Output";
import Input from "./Input";

const CodeEditor = () => {
    const editorRef = useRef();
    const [value, setValue] = useState("");
    const [language, setLanguage] = useState("python");

    const onMount = (editor) => {
        editorRef.current = editor;
        editor.focus();
    };

    const onSelect = (language) => {
        setLanguage(language);
        setValue(SNIPPETS[language]);
    };

    return (
        <Box>
            <Selector language={language} onSelect={onSelect} />

            <HStack spacing={4} alignItems="flex-start">

                <Box w="50%">
                    <Editor
                        height="75vh"
                        theme="vs-dark"
                        language={language}
                        defaultValue={SNIPPETS[language]}
                        onMount={onMount}
                        value={value}
                        onChange={(value) => setValue(value)}
                    />
                </Box>

                <VStack w="50%" spacing={2} alignItems="stretch" height="75vh">
                    <Input />
                    <Output />
                </VStack>

            </HStack>
        </Box>
    );
};
export default CodeEditor;