import { useState } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Button,
    Input,
    FormControl,
    FormLabel,
    VStack,
    Text,
    useToast,
    FormErrorMessage,
} from "@chakra-ui/react";
import { apiLogin } from "../api/client";

const Login = ({ isOpen, onClose, onLoginSuccess, onResetPassword }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const toast = useToast();

    const validate = () => {
        const e = {};
        if (!username.trim()) e.username = "Username is required";
        if (!password) e.password = "Password is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const data = await apiLogin(username, password);
            localStorage.setItem("token", data.token);
            toast({ title: "Welcome back!", status: "success", duration: 2000, isClosable: true });
            onLoginSuccess && onLoginSuccess(username);
            onClose();
            setUsername("");
            setPassword("");
            setErrors({});
        } catch (err) {
            toast({ title: "Invalid username or password", status: "error", duration: 3000, isClosable: true });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleLogin();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Log In</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4}>
                        <FormControl isInvalid={!!errors.username}>
                            <FormLabel>Username</FormLabel>
                            <Input
                                placeholder="Enter username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <FormErrorMessage>{errors.username}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.password}>
                            <FormLabel>Password</FormLabel>
                            <Input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <FormErrorMessage>{errors.password}</FormErrorMessage>
                        </FormControl>

                        <Button colorScheme="green" width="100%" onClick={handleLogin} isLoading={loading}>
                            Log In
                        </Button>

                        <Text
                            fontSize="sm"
                            color="green.400"
                            cursor="pointer"
                            _hover={{ textDecoration: "underline" }}
                            onClick={() => { onClose(); onResetPassword && onResetPassword(); }}
                        >
                            Reset Password
                        </Text>

                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default Login;