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
} from "@chakra-ui/react";

const Login = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Log In</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4}>

                        <FormControl>
                            <FormLabel>Username</FormLabel>
                            <Input placeholder="Enter username" />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Password</FormLabel>
                            <Input type="password" placeholder="Enter password" />
                        </FormControl>

                        <Button colorScheme="green" width="100%">
                            Log In
                        </Button>

                        <Text
                            fontSize="sm"
                            color="green.400"
                            cursor="pointer"
                            _hover={{ textDecoration: "underline" }}
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