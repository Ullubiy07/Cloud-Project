import { useState } from "react";
import {
    Box, Text, IconButton, Input,
    VStack, HStack, useColorMode, Tooltip,
} from "@chakra-ui/react";

const Files = ({ activeFile, onSelect, files, onFileCreate, onFileDelete, onFileRename }) => {
    const { colorMode } = useColorMode();
    const [isOpen, setIsOpen] = useState(true);
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState("");

    const bg = colorMode === "dark" ? "#16161a" : "gray.50";
    const border = colorMode === "dark" ? "#2a2a35" : "gray.200";
    const activeColor = colorMode === "dark" ? "#2a2a35" : "blue.50";

    const onCreate = () => {
        const newFile = { id: Date.now(), name: `file${files.length + 1}.py` };
        onFileCreate(newFile);
    };

    const onDelete = (id) => {
        onFileDelete(id);
    };

    const startRename = (file) => {
        setRenamingId(file.id);
        setRenameValue(file.name);
    };

    const confirmRename = (id) => {
        onFileRename(id, renameValue);
        setRenamingId(null);
    };

    return (
        <Box
            height="100%"
            bg={bg}
            borderRight="1px solid"
            borderColor={border}
            transition="width 0.2s"
            width={isOpen ? "220px" : "40px"}
            overflow="hidden"
            flexShrink={0}
        >
        <HStack
            justifyContent="space-between"
            px={2}
            py={2}
            borderBottom="1px solid"
            borderColor={border}
        >
            {isOpen && (
                <Text fontSize="xs" color="gray.500" letterSpacing={1} fontWeight="bold">
                    FILES
                </Text>
            )}
            <HStack>
                {isOpen && (
                    <Tooltip label="New file">
                        <IconButton
                            icon={<span>+</span>}
                            size="xs"
                            variant="ghost"
                            onClick={onCreate}
                        />
                    </Tooltip>
                )}
                <Tooltip label={isOpen ? "Collapse" : "Expand"}>
                    <IconButton
                        icon={<span>{isOpen ? "«" : "»"}</span>}
                        size="xs"
                        variant="ghost"
                        onClick={() => setIsOpen(prev => !prev)}
                    />
                </Tooltip>
            </HStack>
        </HStack>

        {isOpen && (
            <VStack spacing={0} align="stretch" pt={1}>
                {files.map(file => (
                        <Box
                            key={file.id}
                            role="group"
                            px={3} py={1}
                            cursor="pointer"
                            bg={activeFile?.id === file.id ? activeColor : "transparent"}
                            borderLeft="2px solid"
                            borderColor={activeFile?.id === file.id ? "green.400" : "transparent"}
                            _hover={{ bg: activeColor }}
                            onClick={() => onSelect(file)}
                        >
                        {renamingId === file.id ? (
                            <Input
                                size="xs"
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onBlur={() => confirmRename(file.id)}
                                onKeyDown={e => e.key === "Enter" && confirmRename(file.id)}
                                autoFocus
                                onClick={e => e.stopPropagation()}
                            />
                        ) : (
                            <HStack justifyContent="space-between">
                                <Text fontSize="sm">📄 {file.name}</Text>
                                <HStack spacing={0} opacity={0} _groupHover={{ opacity: 1 }}>
                                    <Tooltip label="Rename">
                                        <IconButton
                                            icon={<span>✒️</span>}
                                            size="xs"
                                            variant="ghost"
                                            onClick={e => { e.stopPropagation(); startRename(file); }}
                                        />
                                    </Tooltip>
                                    <Tooltip label="Delete">
                                        <IconButton
                                            icon={<span>🗑️</span>}
                                            size="xs"
                                            variant="ghost"
                                            onClick={e => { e.stopPropagation(); onDelete(file.id); }}
                                        />
                                    </Tooltip>
                                </HStack>
                            </HStack>
                        )}
                    </Box>
                ))}
            </VStack>
        )}
        </Box>
    );
};

export default Files;