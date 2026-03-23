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

const Sign = ({isOpen, onClose}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    Sign Up
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4}>

                        <FormControl>
                            <FormLabel>Username</FormLabel>
                            <Input placeholder="Enter username" />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Email</FormLabel>
                            <Input type="email" placeholder="Enter email" />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Password</FormLabel>
                            <Input type="password" placeholder="Enter password" />
                        </FormControl>

                        <Button colorScheme="green" width="100%">
                            Sign Up
                        </Button>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};
export default Sign;