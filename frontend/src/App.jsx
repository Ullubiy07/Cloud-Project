import { Box } from '@chakra-ui/react';
import CodeEditor from './components/CodeEditor';
import Navbar from './components/Navbar';

function App() {
  return (
    <Box minH="100vh" bg="gray.900" _light={{ bg: "white" }} color="gray.500">
      <Navbar />
      <CodeEditor />
    </Box>
  );
};
export default App;