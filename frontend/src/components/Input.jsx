import { Box, Text, useColorMode } from "@chakra-ui/react";

const Input = ({ stdin, onStdin }) => {
    const { colorMode } = useColorMode();

    return (
        <Box
            mb={2}
            p={2}
            border="1px solid"
            borderRadius={10}
            borderColor={colorMode === "dark" ? "#333" : "gray.200"}
        >
            <Text mb={2} color="gray.500">Input</Text>
            <textarea
                value={stdin}
                onChange={(e) => onStdin(e.target.value)}
                style={{
                    width: "100%",
                    background: "transparent",
                    color: colorMode === "dark" ? "white" : "black",
                    outline: "none",
                    resize: "none",
                    fontFamily: "monospace",
                }}
                rows={4}
                placeholder="Enter input for your program..."
            />
        </Box>
    );
};
export default Input;