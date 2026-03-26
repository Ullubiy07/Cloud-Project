import { useState } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
    ModalCloseButton, Button, Input, FormControl, FormLabel,
    VStack, Text, useToast, FormErrorMessage,
} from "@chakra-ui/react";
import { apiRequestReset } from "../api/client";

const ResetPassword = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [errors, setErrors] = useState({});
    const toast = useToast();

    const validate = () => {
        const e = {};
        if (!email.trim()) e.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email format";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleReset = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await apiRequestReset(email);
            setSent(true);
        } catch (err) {
            toast({ title: "Something went wrong. Try again.", status: "error", duration: 3000, isClosable: true });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSent(false);
        setEmail("");
        setErrors({});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Reset Password</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    {sent ? (
                        <VStack spacing={4} py={4}>
                            <Text textAlign="center" color="green.400" fontWeight="600">
                                ✓ Check your email
                            </Text>
                            <Text textAlign="center" fontSize="sm" color="gray.500">
                                If an account with <strong>{email}</strong> exists, you'll receive a password reset link shortly.
                            </Text>
                            <Button colorScheme="green" width="100%" onClick={handleClose}>
                                Close
                            </Button>
                        </VStack>
                    ) : (
                        <VStack spacing={4}>
                            <Text fontSize="sm" color="gray.500">
                                Enter your email and we'll send you a reset link.
                            </Text>
                            <FormControl isInvalid={!!errors.email}>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleReset()}
                                />
                                <FormErrorMessage>{errors.email}</FormErrorMessage>
                            </FormControl>
                            <Button colorScheme="green" width="100%" onClick={handleReset} isLoading={loading}>
                                Send Reset Link
                            </Button>
                        </VStack>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ResetPassword;