import { Box, Text } from "@chakra-ui/react";

const Input = () => {
    return (
        <Box
            mb={2}
            p={2}
            border="1px solid"
            borderRadius={10}
            borderColor="#333"
        >
            <Text mb={2} color="gray.500">Input</Text>
            <textarea
                style={{
                    width: "100%",
                    background: "transparent",
                    color: "white",
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