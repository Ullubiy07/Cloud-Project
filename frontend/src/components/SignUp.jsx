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
    useToast,
    FormErrorMessage,
} from "@chakra-ui/react";
import { apiRegister } from "../api/client";

const SignUp = ({ isOpen, onClose, onSignUpSuccess }) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const toast = useToast();

    const validate = () => {
        const e = {};
        if (!username.trim()) e.username = "Username is required";
        if (!email.trim()) e.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email format";
        if (!password) e.password = "Password is required";
        else if (password.length < 8) e.password = "Password must be at least 8 characters";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSignUp = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await apiRegister(username, email, password);
            toast({ title: "Account created! Please log in.", status: "success", duration: 3000, isClosable: true });
            onSignUpSuccess && onSignUpSuccess();
            onClose();
            setUsername(""); setEmail(""); setPassword(""); setErrors({});
        } catch (err) {
            toast({ title: "Username or email already exists", status: "error", duration: 3000, isClosable: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Sign Up</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4}>
                        <FormControl isInvalid={!!errors.username}>
                            <FormLabel>Username</FormLabel>
                            <Input placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} />
                            <FormErrorMessage>{errors.username}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.email}>
                            <FormLabel>Email</FormLabel>
                            <Input type="email" placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} />
                            <FormErrorMessage>{errors.email}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.password}>
                            <FormLabel>Password</FormLabel>
                            <Input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} />
                            <FormErrorMessage>{errors.password}</FormErrorMessage>
                        </FormControl>

                        <Button colorScheme="green" width="100%" onClick={handleSignUp} isLoading={loading}>
                            Sign Up
                        </Button>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};
export default SignUp;