import { useState } from "react";
import {
    Box, VStack, Heading, FormControl, FormLabel,
    Input, Button, Text, FormErrorMessage, useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
 
const ResetPasswordPage = () => {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();
 
    const validate = () => {
        const e = {};
        if (!password) e.password = "Password is required";
        else if (password.length < 8) e.password = "Minimum 8 characters";
        if (!confirm) e.confirm = "Please confirm your password";
        else if (password !== confirm) e.confirm = "Passwords do not match";
        setErrors(e);
        return Object.keys(e).length === 0;
    };
 
    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 800));
        setDone(true);
        setLoading(false);
    };
 
    return (
        <Box minH="100vh" bg="gray.900" display="flex" alignItems="center" justifyContent="center">
            <Box bg="gray.800" p={8} borderRadius="xl" w="full" maxW="400px" boxShadow="xl">
                {done ? (
                    <VStack spacing={4}>
                        <Text fontSize="2xl">✓</Text>
                        <Heading size="md" color="green.400">Password changed!</Heading>
                        <Text fontSize="sm" color="gray.400" textAlign="center">
                            Your password has been updated successfully.
                        </Text>
                        <Button colorScheme="green" width="100%" onClick={() => navigate("/")}>
                            Back to Editor
                        </Button>
                    </VStack>
                ) : (
                    <VStack spacing={5}>
                        <Heading size="md" color="white">Set New Password</Heading>
                        <Text fontSize="sm" color="gray.400" textAlign="center">
                            Enter your new password below.
                        </Text>
 
                        <FormControl isInvalid={!!errors.password}>
                            <FormLabel color="gray.300">New Password</FormLabel>
                            <Input
                                type="password"
                                placeholder="Min 8 characters"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                bg="gray.700"
                                border="none"
                                color="white"
                            />
                            <FormErrorMessage>{errors.password}</FormErrorMessage>
                        </FormControl>
 
                        <FormControl isInvalid={!!errors.confirm}>
                            <FormLabel color="gray.300">Confirm Password</FormLabel>
                            <Input
                                type="password"
                                placeholder="Repeat password"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                                bg="gray.700"
                                border="none"
                                color="white"
                            />
                            <FormErrorMessage>{errors.confirm}</FormErrorMessage>
                        </FormControl>
 
                        <Button colorScheme="green" width="100%" onClick={handleSubmit} isLoading={loading}>
                            Change Password
                        </Button>
                    </VStack>
                )}
            </Box>
        </Box>
    );
};
 
export default ResetPasswordPage;