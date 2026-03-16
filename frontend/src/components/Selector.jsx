import {
  Box, Button, Menu, MenuButton, MenuItem,
  MenuList, Text, useColorMode,
} from "@chakra-ui/react";
import { LANGUAGES } from "../constants";

const languages = Object.entries(LANGUAGES);

const Selector = ({ language, onSelect, fontSize, onFontSize, onRun, loading }) => {
    const { colorMode, toggleColorMode } = useColorMode();

    return (
        <Box ml={2} m={4}>
            <Button
                variant="outline"
                colorScheme="green"
                mr={4}
                onClick={onRun}
                isLoading={loading}
                loadingText="Running"
            >
                Run
            </Button>

            <Menu isLazy>
                <MenuButton as={Button}>{language}</MenuButton>
                <MenuList bg="#110c1b">
                    {languages.map(([lang, version]) => (
                        <MenuItem
                            key={lang}
                            color={lang === language ? "blue.400" : ""}
                            bg={lang === language ? "gray.900" : "transparent"}
                            _hover={{ color: "blue.400", bg: "gray.900" }}
                            onClick={() => onSelect(lang)}
                        >
                            {lang}&nbsp;
                            <Text as="span" color="gray.600" fontSize="sm">({version})</Text>
                        </MenuItem>
                    ))}
                </MenuList>
            </Menu>

            <Button variant="outline" onClick={toggleColorMode} ml={4}>
                {colorMode === "dark" ? "Light" : "Dark"}
            </Button>
            <Button variant="outline" onClick={() => onFontSize(-1)} ml={4}>-</Button>
            <Text as="span" mx={2} fontSize="sm">{fontSize}px</Text>
            <Button variant="outline" onClick={() => onFontSize(1)}>+</Button>
        </Box>
    );
};
export default Selector;