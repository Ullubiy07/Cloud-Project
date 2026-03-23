import { Box, HStack, Text, Button, useColorMode, useDisclosure, Avatar, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import Login from "./Login";
import SignUp from "./SignUp";
import ResetPassword from "./ResetPassword";

const Navbar = ({ user, onLogin, onLogout }) => {
    const { colorMode } = useColorMode();
    const { isOpen: isLoginOpen, onOpen: onLoginOpen, onClose: onLoginClose } = useDisclosure();
    const { isOpen: isSignOpen, onOpen: onSignOpen, onClose: onSignClose } = useDisclosure();
    const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();

    const handleLoginSuccess = (username) => {
        onLogin && onLogin(username);
    };

    const handleSignUpSuccess = () => {
        onSignClose();
        onLoginOpen();
    };

    const handleResetPassword = () => {
        onResetOpen();
    };

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
                    {user ? (
                        <Menu>
                            <MenuButton as={Button} variant="ghost" size="sm">
                                <HStack spacing={2}>
                                    <Avatar size="xs" name={user} />
                                    <Text fontSize="sm">{user}</Text>
                                </HStack>
                            </MenuButton>
                            <MenuList>
                                <MenuItem onClick={handleResetPassword}>Change Password</MenuItem>
                                <MenuItem color="red.400" onClick={onLogout}>Log Out</MenuItem>
                            </MenuList>
                        </Menu>
                    ) : (
                        <>
                            <Button variant="outline" colorScheme="blue" size="sm" onClick={onLoginOpen}>
                                Log In
                            </Button>
                            <Button variant="outline" colorScheme="blue" size="sm" onClick={onSignOpen}>
                                Sign Up
                            </Button>
                        </>
                    )}
                </HStack>
            </HStack>

            <Login
                isOpen={isLoginOpen}
                onClose={onLoginClose}
                onLoginSuccess={handleLoginSuccess}
                onResetPassword={handleResetPassword}
            />
            <SignUp
                isOpen={isSignOpen}
                onClose={onSignClose}
                onSignUpSuccess={handleSignUpSuccess}
            />
            <ResetPassword isOpen={isResetOpen} onClose={onResetClose} />
        </Box>
    );
};

export default Navbar;