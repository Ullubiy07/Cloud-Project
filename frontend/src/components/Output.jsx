import { Box, Text, Spinner, useColorMode } from "@chakra-ui/react";

const Output = ({ output, loading }) => {
    const { colorMode } = useColorMode();

    return (
        <Box
            flex={1}
            p={2}
            border="1px solid"
            borderRadius={10}
            borderColor={colorMode === "dark" ? "#333" : "gray.200"}
            overflow="auto"
            fontFamily="monospace"
            fontSize="sm"
        >
            {loading && <Spinner size="sm" color="green.400" />}

            {!loading && !output && (
                <Text color="gray.500">Output will appear here...</Text>
            )}

            {!loading && output && (
                <>
                    {output.stdout && (
                        <Text
                            color={colorMode === "dark" ? "white" : "black"}
                            whiteSpace="pre-wrap"
                        >
                            {output.stdout}
                        </Text>
                    )}
                    {output.stderr && (
                        <Text color="red.400" whiteSpace="pre-wrap">
                            {output.stderr}
                        </Text>
                    )}
                    {output.metrics && (
                        <Text color="gray.500" mt={2} fontSize="xs">
                            ⏱ {output.metrics.run_time} · 💾 {output.metrics.run_memory}
                        </Text>
                    )}
                </>
            )}
        </Box>
    );
};
export default Output;