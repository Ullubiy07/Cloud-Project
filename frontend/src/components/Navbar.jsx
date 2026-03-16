import { Box, HStack, Text, Button, useColorMode, useDisclosure } from "@chakra-ui/react";
import Login from "./Login";
import Sign from "./SignUp";

const Navbar = () => {
    const { colorMode } = useColorMode();
    const { isOpen: isLoginOpen, onOpen: onLoginOpen, onClose: onLoginClose } = useDisclosure();
    const { isOpen: isSignOpen, onOpen: onSignOpen, onClose: onSignClose } = useDisclosure();

    return (
        <Box
            px={4}
            py={2}
            bg="gray.900"
            _light={{ bg: "gray.100" }}
            borderBottom="1px solid"
            borderColor={colorMode === "dark" ? "#2a2a35" : "gray.200"}
        >
            <HStack justifyContent="space-between">

                <Text fontWeight="700" fontSize="lg" letterSpacing="1px">
                    Cloud Editor
                </Text>

                <HStack spacing={2}>
                    <Button variant="outline" colorScheme="blue" size="sm" onClick={onLoginOpen}>
                        Log In
                    </Button>
                    <Button variant="outline" colorScheme="blue" size="sm" onClick={onSignOpen}>
                        Sign Up
                    </Button>
                </HStack>

            </HStack>
            <Login isOpen={isLoginOpen} onClose={onLoginClose} />
            <Sign isOpen={isSignOpen} onClose={onSignClose} />
        </Box>
    );
};
export default Navbar;