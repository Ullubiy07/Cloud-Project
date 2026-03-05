import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { LANGUAGES } from "../constants";

const languages = Object.entries(LANGUAGES);

const Selector = ({ language, onSelect }) => {
  return (
    <Box ml={2} mb={4}>
        <Button variant="outline" colorScheme="green" mr={2}>
            Run
        </Button>
        <Menu isLazy>
            <MenuButton as={Button}>{language}</MenuButton>
            <MenuList bg="#110c1b">
                {languages.map(
                    ([lang, version]) => (
                        <MenuItem
                        key={lang}
                        color={lang === language ? "blue.400" : ""}
                        bg={lang === language ? "gray.900" : "transparent"}
                        _hover={{
                            color: "blue.400",
                            bg: "gray.900",
                        }}
                        onClick={() => onSelect(lang)}
                        >
                        {lang}
                        &nbsp;
                        <Text as="span" color="gray.600" fontSize="sm">({version})</Text>
                        </MenuItem>
                    )
                )}
            </MenuList>
      </Menu>
    </Box>
  );
};
export default Selector;